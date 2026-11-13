import type { VercelRequest, VercelResponse } from "@vercel/node";
import { redeliver, type MailInput } from "../_lib/mail/send";
import { adminDb } from "../_lib/firebaseAdmin";
import { requireMethod, verifyCronSecret } from "../_lib/auth";
import { withErrorHandling } from "../_lib/http";

const MAX_ATTEMPTS = 3;

/**
 * Reprocessa e-mails que falharam no envio imediato (ver api/_lib/mail/send.ts).
 * Disparada 1x/dia pelo Cron da Vercel.
 */
export default withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  if (!requireMethod(req, res, ["GET", "POST"])) return;
  verifyCronSecret(req);

  const failedSnap = await adminDb.collection("mail").where("status", "==", "failed").get();
  const toRetry = failedSnap.docs.filter((d) => (d.data().attempts ?? 0) < MAX_ATTEMPTS);

  let retried = 0;
  for (const doc of toRetry) {
    await redeliver(doc.ref, doc.data() as MailInput);
    retried++;
  }

  res.status(200).json({ retried, skipped: failedSnap.size - toRetry.length });
});
