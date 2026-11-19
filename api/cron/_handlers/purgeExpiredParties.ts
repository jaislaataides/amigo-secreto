import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Timestamp } from "firebase-admin/firestore";
import { adminDb } from "../../_lib/firebaseAdmin.js";
import { requireMethod, verifyCronSecret } from "../../_lib/auth.js";
import { withErrorHandling } from "../../_lib/http.js";

/**
 * Exclui permanentemente parties sorteadas há mais de 15 dias (doc +
 * subcoleções — a imagem de capa já mora dentro do próprio doc, não há
 * Storage envolvido). Disparada 1x/dia pelo Cron da Vercel — é a única
 * forma de "retenção de dados" deste app: nada fica para sempre.
 */
export const purgeExpiredParties = withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  if (!requireMethod(req, res, ["GET", "POST"])) return;
  verifyCronSecret(req);

  const now = Timestamp.now();
  const expiredSnap = await adminDb
    .collection("parties")
    .where("status", "==", "drawn")
    .where("purgeAt", "<=", now)
    .get();

  let purged = 0;
  for (const partyDoc of expiredSnap.docs) {
    await adminDb.recursiveDelete(partyDoc.ref);
    purged++;
  }

  res.status(200).json({ purged });
});
