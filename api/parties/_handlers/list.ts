import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb } from "../../_lib/firebaseAdmin.js";
import { requireMethod, verifyAuth } from "../../_lib/auth.js";
import { withErrorHandling } from "../../_lib/http.js";

/**
 * GET /api/parties — lista as parties do owner logado (ou todas, se admin).
 * `?scope=mine` força só as criadas por quem está logado, mesmo sendo admin
 * (usado em "Minhas parties"; o painel de admin continua vendo todas).
 */
export const listParties = withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  if (!requireMethod(req, res, ["GET"])) return;

  const decoded = await verifyAuth(req);

  // Lê da URL também: o roteador faz o próprio parse do caminho e o
  // req.query pode não vir preenchido depois do rewrite.
  const scope = new URL(req.url ?? "/", "http://localhost").searchParams.get("scope") ?? req.query.scope;
  const onlyMine = scope === "mine";
  const query =
    decoded.admin === true && !onlyMine
      ? adminDb.collection("parties").orderBy("createdAt", "desc")
      : adminDb
          .collection("parties")
          .where("ownerUid", "==", decoded.uid)
          .orderBy("createdAt", "desc");

  const snapshot = await query.get();
  const parties = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  res.status(200).json({ parties });
});
