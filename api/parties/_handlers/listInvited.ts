import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { DocumentReference } from "firebase-admin/firestore";
import { adminDb } from "../../_lib/firebaseAdmin.js";
import { ApiError, normalizeEmail, requireMethod, verifyAuth } from "../../_lib/auth.js";
import { withErrorHandling } from "../../_lib/http.js";
import type { Participant, Party } from "../../../shared/types.js";

/**
 * GET /api/parties/invited — parties em que o e-mail logado é participante
 * (convites), com a resposta dele (rsvp). Ficam de fora as que ele mesmo
 * organiza (participante isOwner), que já aparecem em "criadas por você".
 *
 * Só devolve dados públicos da party + o próprio rsvp; nada de outros
 * participantes. Usa o índice de collection group em participants.email
 * (firestore.indexes.json).
 */
export const listInvitedParties = withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  if (!requireMethod(req, res, ["GET"])) return;

  const decoded = await verifyAuth(req);
  if (!decoded.email) {
    throw new ApiError(400, "no-email", "Sua conta Google não tem e-mail.");
  }
  const email = normalizeEmail(decoded.email);

  const participations = await adminDb.collectionGroup("participants").where("email", "==", email).get();

  const mine = participations.docs
    .map((doc) => ({ partyRef: doc.ref.parent.parent, participant: doc.data() as Participant }))
    .filter(
      (p): p is { partyRef: DocumentReference; participant: Participant } =>
        p.partyRef !== null && p.participant.isOwner !== true,
    );

  if (mine.length === 0) {
    res.status(200).json({ parties: [] });
    return;
  }

  const partyDocs = await adminDb.getAll(...mine.map((p) => p.partyRef));

  const parties = partyDocs
    .map((doc, i) => {
      // Party apagada (expurgo pós-sorteio) deixa participante órfão.
      if (!doc.exists) return null;
      const party = doc.data() as Party;
      return {
        id: doc.id,
        name: party.name,
        imageUrl: party.imageUrl,
        status: party.status,
        ownerEmail: party.ownerEmail,
        rsvp: mine[i].participant.rsvp,
        createdAt: party.createdAt,
      };
    })
    .filter((p) => p !== null)
    .sort((a, b) => seconds(b.createdAt) - seconds(a.createdAt))
    .map(({ createdAt: _createdAt, ...rest }) => rest);

  res.status(200).json({ parties });
});

function seconds(ts: unknown): number {
  if (ts && typeof ts === "object") {
    const t = ts as { seconds?: number; _seconds?: number };
    return t.seconds ?? t._seconds ?? 0;
  }
  return 0;
}
