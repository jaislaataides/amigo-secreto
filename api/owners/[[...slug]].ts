import type { VercelRequest, VercelResponse } from "@vercel/node";
import { requestOwnerAccess } from "./_handlers/request";
import { approveOwner } from "./_handlers/approve";

/** Roteador único pra /api/owners/request e /api/owners/approve (ver api/parties/[[...slug]].ts). */
export default async function router(req: VercelRequest, res: VercelResponse) {
  const raw = req.query.slug;
  const slug = Array.isArray(raw) ? raw : raw ? [raw] : [];

  if (slug.length === 1 && slug[0] === "request") {
    return requestOwnerAccess(req, res);
  }
  if (slug.length === 1 && slug[0] === "approve") {
    return approveOwner(req, res);
  }

  res.status(404).json({ error: { code: "not-found", message: "Rota não encontrada." } });
}
