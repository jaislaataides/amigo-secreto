import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Timestamp } from "firebase-admin/firestore";
import { encryptAssignment, generatePossessionToken, hashPossessionToken, unwrapDek } from "../../_lib/crypto/envelope.js";
import { runDerangementDraw, type ExclusionInput } from "../../_lib/draw/derangement.js";
import { getAppBaseUrl } from "../../_lib/env.js";
import { enqueueAndSend } from "../../_lib/mail/send.js";
import { adminDb } from "../../_lib/firebaseAdmin.js";
import { ApiError, requireMethod, verifyAuth } from "../../_lib/auth.js";
import { requireQueryParam, withErrorHandling } from "../../_lib/http.js";
import { loadPartyOrThrow, requirePartyOwnerOrAdmin } from "../../_lib/party.js";
import type { DekMeta, Participant } from "../../../shared/types.js";

const MIN_GOING_PARTICIPANTS = 3;
const PURGE_AFTER_DAYS = 15;

export const runDraw = withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  if (!requireMethod(req, res, ["POST"])) return;

  const decoded = await verifyAuth(req);
  const partyId = requireQueryParam(req, "id");
  const { ref, party } = await loadPartyOrThrow(partyId);
  requirePartyOwnerOrAdmin(party, decoded);

  if (party.status === "drawn" || party.status === "canceled") {
    throw new ApiError(409, "already-drawn", "Esta party já foi sorteada (ou foi cancelada).");
  }

  const [participantsSnap, exclusionsSnap] = await Promise.all([
    ref.collection("participants").get(),
    ref.collection("exclusions").get(),
  ]);

  const participants = participantsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Participant) }));
  const going = participants.filter((p) => p.rsvp === "going");
  const pending = participants.filter((p) => p.rsvp === "pending");

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

  const rawTokensByParticipant = new Map<string, string>();

  await adminDb.runTransaction(async (tx) => {
    const freshSnap = await tx.get(ref);
    const freshParty = freshSnap.data();
    if (freshParty?.status === "drawn") {
      throw new ApiError(409, "already-drawn", "Esta party já foi sorteada.");
    }

    for (const [giverId, receiverId] of outcome.assignments) {
      const encrypted = encryptAssignment(dek, partyId, giverId, receiverId);
      tx.set(ref.collection("assignments").doc(giverId), {
        giverParticipantId: giverId,
        ...encrypted,
        dekVersion: 1,
        createdAt: now,
        revealCount: 0,
      });

      const rawToken = generatePossessionToken();
      rawTokensByParticipant.set(giverId, rawToken);
      tx.set(ref.collection("possessionTokens").doc(giverId), {
        tokenHash: hashPossessionToken(rawToken),
        createdAt: now,
        usedCount: 0,
      });
    }

    tx.update(ref, { status: "drawn", drawnAt: now, purgeAt, updatedAt: now });
  });

  const baseUrl = getAppBaseUrl();
  await Promise.all(
    going.map(async (p) => {
      const token = rawTokensByParticipant.get(p.id);
      if (!token) return;
      const revealUrl = `${baseUrl}/reveal/${partyId}/${p.id}?t=${token}`;
      await enqueueAndSend({
        template: "reveal_link",
        to: p.email,
        partyId,
        participantId: p.id,
        payload: { participantName: p.name, partyName: party.name, revealUrl },
      }).catch(() => undefined);
    }),
  );

  await enqueueAndSend({
    template: "draw_done_owner",
    to: party.ownerEmail,
    partyId,
    payload: { partyName: party.name },
  }).catch(() => undefined);

  res.status(200).json({ ok: true, assignedCount: outcome.assignments.size });
});
