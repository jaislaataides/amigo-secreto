import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Timestamp } from "firebase-admin/firestore";
import { encryptAssignment, unwrapDek } from "../../_lib/crypto/envelope.js";
import { runDerangementDraw, type ExclusionInput } from "../../_lib/draw/derangement.js";
import { issueLinkToken } from "../../_lib/crypto/linkTokens.js";
import { enqueueAndSend } from "../../_lib/mail/send.js";
import { adminDb } from "../../_lib/firebaseAdmin.js";
import { ApiError, requireMethod, verifyAuth } from "../../_lib/auth.js";
import { requireQueryParam, withErrorHandling } from "../../_lib/http.js";
import { effectiveRsvp, loadPartyOrThrow, requirePartyOwnerOrAdmin } from "../../_lib/party.js";
import type { DekMeta, Participant } from "../../../shared/types.js";

const MIN_GOING_PARTICIPANTS = 3;
const PURGE_AFTER_DAYS = 15;

export const runDraw = withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  if (!requireMethod(req, res, ["POST"])) return;

  const decoded = await verifyAuth(req);
  const partyId = requireQueryParam(req, "id");
  const { ref, party } = await loadPartyOrThrow(partyId);
  requirePartyOwnerOrAdmin(party, decoded);

  if (party.status === "canceled") {
    throw new ApiError(409, "already-drawn", "Esta party foi cancelada.");
  }

  // Sortear de novo só é permitido antes do prazo de confirmação vencer —
  // depois disso, o resultado já pode ter sido aberto por alguém e vira
  // definitivo (ver reveal.ts: o link de posse velho deixa de valer assim
  // que a gente sobrescreve o documento abaixo).
  const isRedraw = party.status === "drawn";
  if (isRedraw && Date.now() >= party.rsvpDeadline.toMillis()) {
    throw new ApiError(409, "redraw-window-closed", "O prazo pra sortear novamente já passou.");
  }

  const [participantsSnap, exclusionsSnap] = await Promise.all([
    ref.collection("participants").get(),
    ref.collection("exclusions").get(),
  ]);

  const participants = participantsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Participant) }));
  const going = participants.filter((p) => effectiveRsvp(p) === "going");
  const pending = participants.filter((p) => effectiveRsvp(p) === "pending");

  if (!isRedraw) {
    const allResponded = pending.length === 0;
    const deadlinePassed = Date.now() >= party.rsvpDeadline.toMillis();
    const eligible = allResponded || (deadlinePassed && going.length >= MIN_GOING_PARTICIPANTS);

    if (!eligible) {
      throw new ApiError(
        409,
        "draw-not-ready",
        allResponded
          ? "Aguardando confirmações."
          : `Ainda há ${pending.length} participante(s) sem responder, e o prazo (${party.rsvpDeadline
              .toDate()
              .toLocaleDateString("pt-BR")}) ainda não venceu.`,
      );
    }
  }

  if (going.length < MIN_GOING_PARTICIPANTS) {
    throw new ApiError(
      409,
      "not-enough-participants",
      `É preciso de pelo menos ${MIN_GOING_PARTICIPANTS} confirmados para sortear (há ${going.length}).`,
    );
  }

  const exclusions: ExclusionInput[] = exclusionsSnap.docs.map((d) => {
    const data = d.data();
    return { type: data.type, participantIds: data.participantIds };
  });

  const goingIds = going.map((p) => p.id);
  const outcome = runDerangementDraw(goingIds, exclusions);

  if (!outcome.ok) {
    const byId = new Map(going.map((p) => [p.id, p.name]));
    const overConstrainedNames = outcome.overConstrainedParticipantIds.map((id) => byId.get(id) ?? id);

    await enqueueAndSend({
      template: "draw_infeasible_owner",
      to: party.ownerEmail,
      partyId,
      payload: { partyName: party.name, overConstrainedNames },
    }).catch(() => undefined);

    throw new ApiError(
      409,
      "draw-infeasible",
      `Não é possível sortear com as exclusões atuais. Sem combinação possível: ${overConstrainedNames.join(", ")}.`,
    );
  }

  const dekMetaSnap = await ref.collection("dekMeta").doc("current").get();
  if (!dekMetaSnap.exists) {
    throw new ApiError(500, "missing-dek", "Chave de criptografia da party não encontrada.");
  }
  const dek = unwrapDek(dekMetaSnap.data() as DekMeta);

  const now = Timestamp.now();
  const purgeAt = Timestamp.fromMillis(now.toMillis() + PURGE_AFTER_DAYS * 24 * 60 * 60 * 1000);

  const revealNonceByParticipant = new Map<string, string>();

  // Num re-sorteio, os participantes elegíveis podem ter mudado (alguém
  // desistiu, alguém novo confirmou) — limpa tudo que existia antes pra não
  // sobrar assignment/token órfão de quem não está mais no sorteio novo.
  const [staleAssignments, staleTokens] = isRedraw
    ? await Promise.all([
        ref.collection("assignments").listDocuments(),
        ref.collection("possessionTokens").listDocuments(),
      ])
    : [[], []];

  await adminDb.runTransaction(async (tx) => {
    const freshSnap = await tx.get(ref);
    const freshParty = freshSnap.data();
    if (freshParty?.status === "drawn" && !isRedraw) {
      throw new ApiError(409, "already-drawn", "Esta party já foi sorteada.");
    }

    for (const docRef of staleAssignments) tx.delete(docRef);
    for (const docRef of staleTokens) tx.delete(docRef);

    for (const [giverId, receiverId] of outcome.assignments) {
      const encrypted = encryptAssignment(dek, partyId, giverId, receiverId);
      tx.set(ref.collection("assignments").doc(giverId), {
        giverParticipantId: giverId,
        ...encrypted,
        dekVersion: 1,
        createdAt: now,
        revealCount: 0,
      });

      // Código de revelação derivado (ver crypto/linkTokens.ts): no banco
      // ficam só nonce + hash; o e-mail remonta o link a partir do nonce.
      const { nonce, tokenHash } = issueLinkToken("reveal", partyId, giverId);
      revealNonceByParticipant.set(giverId, nonce);
      tx.set(ref.collection("possessionTokens").doc(giverId), {
        tokenHash,
        nonce,
        createdAt: now,
        usedCount: 0,
      });
    }

    tx.update(ref, { status: "drawn", drawnAt: now, purgeAt, updatedAt: now });
  });

  await Promise.all(
    going.map(async (p) => {
      const nonce = revealNonceByParticipant.get(p.id);
      if (!nonce) return;
      await enqueueAndSend({
        template: "reveal_link",
        to: p.email,
        partyId,
        participantId: p.id,
        payload: { participantName: p.name, partyName: party.name, link: { purpose: "reveal", nonce } },
      }).catch(() => undefined);
    }),
  );

  await enqueueAndSend({
    template: "draw_done_owner",
    to: party.ownerEmail,
    partyId,
    payload: { partyName: party.name },
  }).catch(() => undefined);

  res.status(200).json({ ok: true, assignedCount: outcome.assignments.size, redraw: isRedraw });
});
