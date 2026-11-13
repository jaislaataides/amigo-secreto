import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb } from "../_lib/firebaseAdmin";
import { requireAdmin, requireMethod, verifyAuth } from "../_lib/auth";
import { withErrorHandling } from "../_lib/http";

/** GET /api/admin/owners — lista todos os pedidos/autorizações de owner. */
export default withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  if (!requireMethod(req, res, ["GET"])) return;

  const decoded = await verifyAuth(req);
  requireAdmin(decoded);

  const snapshot = await adminDb.collection("authorizedOwners").orderBy("requestedAt", "desc").get();
  const owners = snapshot.docs.map((d) => d.data());

  res.status(200).json({ owners });
});
