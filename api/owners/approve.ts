import type { VercelRequest, VercelResponse } from "@vercel/node";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "../_lib/firebaseAdmin";
import { ApiError, normalizeEmail, requireAdmin, requireMethod, verifyAuth } from "../_lib/auth";
import { readJsonBody, requireString, withErrorHandling } from "../_lib/http";
import type { AuthorizedOwner } from "../../shared/types";

interface ApproveBody {
  email: string;
  decision: "approved" | "rejected";
}

export default withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  if (!requireMethod(req, res, ["POST"])) return;

  const decoded = await verifyAuth(req);
  requireAdmin(decoded);

  const body = readJsonBody<ApproveBody>(req);
  const email = normalizeEmail(requireString(body.email, "email"));
  if (body.decision !== "approved" && body.decision !== "rejected") {
    throw new ApiError(400, "invalid-body", "decision deve ser 'approved' ou 'rejected'.");
  }

  const ref = adminDb.collection("authorizedOwners").doc(email);
  const snapshot = await ref.get();
  const existing = snapshot.exists ? (snapshot.data() as AuthorizedOwner) : null;

  await ref.set(
    {
      email,
      status: body.decision,
      approvedBy: decoded.uid,
      approvedAt: FieldValue.serverTimestamp(),
      requestedAt: existing?.requestedAt ?? FieldValue.serverTimestamp(),
      uid: existing?.uid ?? null,
    },
    { merge: true },
  );

  // Se a pessoa já logou alguma vez (uid conhecido), aplica o claim na hora.
  // Caso contrário, o claim é resolvido no primeiro login via /api/auth/sync-role.
  if (existing?.uid) {
    const user = await adminAuth.getUser(existing.uid);
    const currentClaims = (user.customClaims ?? {}) as Record<string, unknown>;
    await adminAuth.setCustomUserClaims(existing.uid, {
      ...currentClaims,
      owner: body.decision === "approved",
    });
  }

  res.status(200).json({ status: body.decision });
});
