import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requestOwnerAccess } from "./_handlers/request.js";
import { approveOwner } from "./_handlers/approve.js";

/** Roteador único pra /api/owners/request e /api/owners/approve (ver api/parties/router.ts). */
export default async function router(req: VercelRequest, res: VercelResponse) {
  const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
  const segments = pathname.replace(/^\/api\/owners\/?/, "").split("/").filter(Boolean);

  if (segments.length === 1 && segments[0] === "request") {
    return requestOwnerAccess(req, res);
  }
  if (segments.length === 1 && segments[0] === "approve") {
    return approveOwner(req, res);
  }

  res.status(404).json({ error: { code: "not-found", message: "Rota não encontrada." } });
}
