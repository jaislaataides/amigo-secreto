import type { VercelRequest, VercelResponse } from "@vercel/node";
import { processMail } from "./_handlers/processMail.js";
import { purgeExpiredParties } from "./_handlers/purgeExpiredParties.js";
import { sendReminders } from "./_handlers/sendReminders.js";

/** Roteador único pros 3 cron jobs (ver api/parties/router.ts). */
export default async function router(req: VercelRequest, res: VercelResponse) {
  const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
  const segments = pathname.replace(/^\/api\/cron\/?/, "").split("/").filter(Boolean);

  if (segments.length === 1) {
    switch (segments[0]) {
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
