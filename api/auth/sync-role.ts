import type { VercelRequest, VercelResponse } from "@vercel/node";
import { adminAuth, adminDb } from "../_lib/firebaseAdmin";
import { ApiError, normalizeEmail, requireMethod, verifyAuth } from "../_lib/auth";
import { withErrorHandling } from "../_lib/http";
import type { AuthorizedOwner } from "../../shared/types";

/**
 * Chamada pelo front logo após cada login. Confere `admins/{uid}` e
 * `authorizedOwners/{email}`, recalcula os custom claims (`admin`, `owner`)
 * e devolve o papel resolvido. O front então força `getIdToken(true)` para
 * pegar um token já com os claims atualizados.
 */
export default withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  if (!requireMethod(req, res, ["POST"])) return;

  const decoded = await verifyAuth(req);
  if (!decoded.email) {
    throw new ApiError(400, "no-email", "Sua conta Google não tem e-mail.");
  }
  const email = normalizeEmail(decoded.email);

  const [adminSnapshot, ownerSnapshot] = await Promise.all([
    adminDb.collection("admins").doc(decoded.uid).get(),
    adminDb.collection("authorizedOwners").doc(email).get(),
  ]);

  const isAdmin = adminSnapshot.exists;

  let isOwner = false;
  if (ownerSnapshot.exists) {
    const ownerData = ownerSnapshot.data() as AuthorizedOwner;
    isOwner = ownerData.status === "approved";

    // Vincula o uid na primeira vez que essa pessoa loga, para que uma
    // aprovação futura (se ainda pendente) consiga aplicar o claim na hora.
    if (ownerData.uid !== decoded.uid) {
      await ownerSnapshot.ref.set({ uid: decoded.uid }, { merge: true });
    }
  }

  await adminAuth.setCustomUserClaims(decoded.uid, { admin: isAdmin, owner: isOwner });

  res.status(200).json({ admin: isAdmin, owner: isOwner });
});
