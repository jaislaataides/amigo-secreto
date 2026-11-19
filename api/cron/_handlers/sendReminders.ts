import type { VercelRequest, VercelResponse } from "@vercel/node";
import { enqueueAndSend } from "../../_lib/mail/send.js";
import { adminDb } from "../../_lib/firebaseAdmin.js";
import { requireMethod, verifyCronSecret } from "../../_lib/auth.js";
import { withErrorHandling } from "../../_lib/http.js";
import type { Participant, Party } from "../../../shared/types.js";

/** Disparada 1x/dia pelo Cron da Vercel (ver vercel.json). */
export const sendReminders = withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  if (!requireMethod(req, res, ["GET", "POST"])) return;
  verifyCronSecret(req);

  const partiesSnap = await adminDb.collection("parties").where("status", "==", "collecting").get();

  let remindersSent = 0;
  let skippedWithoutLink = 0;
  for (const partyDoc of partiesSnap.docs) {
    const party = partyDoc.data() as Party;
    const pendingSnap = await partyDoc.ref.collection("participants").where("rsvp", "==", "pending").get();

    for (const participantDoc of pendingSnap.docs) {
      const participant = participantDoc.data() as Participant;
      // Organizador não recebe convite nem lembrete: já conta como confirmado.
      if (participant.isOwner) continue;
      // Sem código de acesso (convidado antes dessa proteção): o link não
      // abriria nada. O organizador precisa reenviar o convite.
      const accessSnap = await partyDoc.ref.collection("accessTokens").doc(participantDoc.id).get();
      const nonce = (accessSnap.data() as { nonce?: string } | undefined)?.nonce;
      if (!nonce) {
        skippedWithoutLink++;
        continue;
      }
      try {
        await enqueueAndSend({
          template: "reminder",
          to: participant.email,
          partyId: partyDoc.id,
          participantId: participantDoc.id,
          payload: {
            participantName: participant.name,
            partyName: party.name,
            link: { purpose: "access", nonce },
          },
        });
        remindersSent++;
      } catch {
        // Falha fica registrada em `mail` com status 'failed' — process-mail reprocessa depois.
      }
    }
  }

  res.status(200).json({ remindersSent, skippedWithoutLink });
});
