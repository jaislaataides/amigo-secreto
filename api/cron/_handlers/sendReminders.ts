import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAppBaseUrl } from "../../_lib/env";
import { enqueueAndSend } from "../../_lib/mail/send";
import { adminDb } from "../../_lib/firebaseAdmin";
import { requireMethod, verifyCronSecret } from "../../_lib/auth";
import { withErrorHandling } from "../../_lib/http";
import type { Participant, Party } from "../../../shared/types";

/** Disparada 1x/dia pelo Cron da Vercel (ver vercel.json). */
export const sendReminders = withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  if (!requireMethod(req, res, ["GET", "POST"])) return;
  verifyCronSecret(req);

  const baseUrl = getAppBaseUrl();
  const partiesSnap = await adminDb.collection("parties").where("status", "==", "collecting").get();

  let remindersSent = 0;
  for (const partyDoc of partiesSnap.docs) {
    const party = partyDoc.data() as Party;
    const pendingSnap = await partyDoc.ref.collection("participants").where("rsvp", "==", "pending").get();

    for (const participantDoc of pendingSnap.docs) {
      const participant = participantDoc.data() as Participant;
      try {
        await enqueueAndSend({
          template: "reminder",
          to: participant.email,
          partyId: partyDoc.id,
          participantId: participantDoc.id,
          payload: {
            participantName: participant.name,
            partyName: party.name,
            joinUrl: `${baseUrl}/p/${partyDoc.id}/rsvp`,
          },
        });
        remindersSent++;
      } catch {
        // Falha fica registrada em `mail` com status 'failed' — process-mail reprocessa depois.
      }
    }
  }

  res.status(200).json({ remindersSent });
});
