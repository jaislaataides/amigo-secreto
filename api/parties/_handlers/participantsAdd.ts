import type { VercelRequest, VercelResponse } from "@vercel/node";
import { FieldValue } from "firebase-admin/firestore";
import { enqueueAndSend } from "../../_lib/mail/send.js";
import { getAppBaseUrl } from "../../_lib/env.js";
import { ApiError, normalizeEmail, requireMethod, verifyAuth } from "../../_lib/auth.js";
import { readJsonBody, requireQueryParam, withErrorHandling } from "../../_lib/http.js";
import { loadPartyOrThrow, requirePartyOwnerOrAdmin } from "../../_lib/party.js";

interface AddParticipantsBody {
  participants: { name: string; email: string }[];
}

export const addParticipants = withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  if (!requireMethod(req, res, ["POST"])) return;

  const decoded = await verifyAuth(req);
  const partyId = requireQueryParam(req, "id");
  const { ref, party } = await loadPartyOrThrow(partyId);
  requirePartyOwnerOrAdmin(party, decoded);

  if (party.status === "drawn" || party.status === "canceled") {
    throw new ApiError(409, "party-locked", "Não é possível adicionar participantes depois do sorteio.");
  }

  const body = readJsonBody<AddParticipantsBody>(req);
  if (!Array.isArray(body.participants) || body.participants.length === 0) {
    throw new ApiError(400, "invalid-body", "Informe ao menos um participante.");
  }

  const incoming = body.participants.map((p) => {
    const name = p.name?.trim();
    const email = p.email ? normalizeEmail(p.email) : "";
    if (!name || !email || !email.includes("@")) {
      throw new ApiError(400, "invalid-body", "Cada participante precisa de nome e e-mail válidos.");
    }
    return { name, email };
  });

  const seen = new Set<string>();
  for (const p of incoming) {
    if (seen.has(p.email)) {
      throw new ApiError(400, "duplicate-email", `E-mail duplicado na lista: ${p.email}.`);
    }
    seen.add(p.email);
  }

  const existingSnap = await ref.collection("participants").get();
  const existingEmails = new Set(existingSnap.docs.map((d) => d.data().email as string));
  for (const p of incoming) {
    if (existingEmails.has(p.email)) {
      throw new ApiError(409, "already-invited", `${p.email} já foi convidado para esta party.`);
    }
  }

  const totalAfter = existingSnap.size + incoming.length;
  if (totalAfter > party.maxParticipants) {
    throw new ApiError(
      409,
      "max-participants-exceeded",
      `Limite de ${party.maxParticipants} participantes excedido (já há ${existingSnap.size}).`,
    );
  }

  const now = FieldValue.serverTimestamp();
  const batch = ref.firestore.batch();
  const created: { id: string; name: string; email: string }[] = [];

  for (const p of incoming) {
    const participantRef = ref.collection("participants").doc();
    batch.set(participantRef, {
      name: p.name,
      email: p.email,
      uid: null,
      inviteStatus: "pending",
      rsvp: "pending",
      preferredCategories: [],
      createdAt: now,
      updatedAt: now,
    });
    created.push({ id: participantRef.id, name: p.name, email: p.email });
  }

  if (party.status === "draft") {
    batch.update(ref, { status: "collecting", updatedAt: now });
  }

  await batch.commit();

  const joinUrl = `${getAppBaseUrl()}/p/${partyId}/rsvp`;
  await Promise.all(
    created.map(async (p) => {
      try {
        await enqueueAndSend({
          template: "invite",
          to: p.email,
          partyId,
          participantId: p.id,
          payload: { participantName: p.name, partyName: party.name, joinUrl },
        });
        await ref.collection("participants").doc(p.id).update({ inviteStatus: "sent" });
      } catch {
        await ref.collection("participants").doc(p.id).update({ inviteStatus: "failed" });
      }
    }),
  );

  res.status(201).json({ created: created.map((p) => p.id) });
});
