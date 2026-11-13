import type { DocumentReference, DocumentSnapshot } from "firebase-admin/firestore";
import type { DecodedIdToken } from "firebase-admin/auth";
import { adminDb } from "./firebaseAdmin";
import { ApiError } from "./auth";
import type { Party } from "../../shared/types";

export async function loadPartyOrThrow(
  partyId: string,
): Promise<{ ref: DocumentReference; snapshot: DocumentSnapshot; party: Party }> {
  const ref = adminDb.collection("parties").doc(partyId);
  const snapshot = await ref.get();
  if (!snapshot.exists) {
    throw new ApiError(404, "not-found", "Party não encontrada.");
  }
  return { ref, snapshot, party: snapshot.data() as Party };
}

export function requirePartyOwnerOrAdmin(party: Party, decoded: DecodedIdToken): void {
  if (party.ownerUid !== decoded.uid && decoded.admin !== true) {
    throw new ApiError(403, "forbidden", "Só o organizador desta party (ou um admin) pode fazer isso.");
  }
}
