import type { VercelRequest, VercelResponse } from "@vercel/node";
import { processMail } from "./_handlers/processMail";
import { purgeExpiredParties } from "./_handlers/purgeExpiredParties";
import { sendReminders } from "./_handlers/sendReminders";

/** Roteador único pros 3 cron jobs (ver api/parties/[[...slug]].ts e vercel.json). */
export default async function router(req: VercelRequest, res: VercelResponse) {
  const raw = req.query.slug;
  const slug = Array.isArray(raw) ? raw : raw ? [raw] : [];

  if (slug.length === 1) {
    switch (slug[0]) {
      case "process-mail":
        return processMail(req, res);
      case "purge-expired-parties":
        return purgeExpiredParties(req, res);
      case "send-reminders":
        return sendReminders(req, res);
    }
  }

  res.status(404).json({ error: { code: "not-found", message: "Rota não encontrada." } });
}
