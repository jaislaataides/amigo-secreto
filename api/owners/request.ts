import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminDb } from "../_lib/firebaseAdmin";
import { normalizeEmail, requireMethod, verifyAuth } from "../_lib/auth";
import { withErrorHandling } from "../_lib/http";
import { FieldValue } from "firebase-admin/firestore";
import type { AuthorizedOwner } from "../../shared/types";

export default withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  if (!requireMethod(req, res, ["POST"])) return;

  const decoded = await verifyAuth(req);
  if (!decoded.email) {
    res.status(400).json({ error: { code: "no-email", message: "Sua conta Google não tem e-mail." } });
    return;
  }
  const email = normalizeEmail(decoded.email);

  const ref = adminDb.collection("authorizedOwners").doc(email);
  const existing = await ref.get();

  if (existing.exists) {
    const data = existing.data() as AuthorizedOwner;
    res.status(200).json({ status: data.status });
    return;
  }

  const doc: AuthorizedOwner = {
    email,
    status: "pending",
    requestedAt: FieldValue.serverTimestamp() as never,
    requestedName: decoded.name ?? null,
    uid: decoded.uid,
  };
  await ref.set(doc);

  res.status(201).json({ status: "pending" });
});
