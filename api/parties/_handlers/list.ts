import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb } from "../../_lib/firebaseAdmin";
import { requireMethod, verifyAuth } from "../../_lib/auth";
import { withErrorHandling } from "../../_lib/http";

/** GET /api/parties — lista as parties do owner logado (ou todas, se admin). */
export const listParties = withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  if (!requireMethod(req, res, ["GET"])) return;

  const decoded = await verifyAuth(req);

  const query =
    decoded.admin === true
      ? adminDb.collection("parties").orderBy("createdAt", "desc")
      : adminDb
          .collection("parties")
          .where("ownerUid", "==", decoded.uid)
          .orderBy("createdAt", "desc");

  const snapshot = await query.get();
  const parties = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  res.status(200).json({ parties });
});
