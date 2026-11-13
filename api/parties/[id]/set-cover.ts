import type { VercelRequest, VercelResponse } from "@vercel/node";
import { FieldValue } from "firebase-admin/firestore";
import { adminBucket } from "../../_lib/firebaseAdmin";
import { ApiError, requireMethod, verifyAuth } from "../../_lib/auth";
import { readJsonBody, requireQueryParam, withErrorHandling } from "../../_lib/http";
import { loadPartyOrThrow, requirePartyOwnerOrAdmin } from "../../_lib/party";

interface SetCoverBody {
  imageVersion: number;
}

export default withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  if (!requireMethod(req, res, ["POST"])) return;

  const decoded = await verifyAuth(req);
  const partyId = requireQueryParam(req, "id");
  const { ref, party } = await loadPartyOrThrow(partyId);
  requirePartyOwnerOrAdmin(party, decoded);

  const body = readJsonBody<SetCoverBody>(req);
  if (typeof body.imageVersion !== "number" || body.imageVersion < 0) {
    throw new ApiError(400, "invalid-body", "imageVersion é obrigatório.");
  }

  // O client já subiu o arquivo direto pro Storage (ver storage.rules);
  // aqui só confirmamos que ele existe antes de gravar a URL na party.
  const objectPath = `partyImages/${partyId}/cover.jpg`;
  const [exists] = await adminBucket.file(objectPath).exists();
  if (!exists) {
    throw new ApiError(400, "upload-missing", "Nenhuma imagem foi enviada para esta party ainda.");
  }

  const encodedPath = encodeURIComponent(objectPath);
  const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${adminBucket.name}/o/${encodedPath}?alt=media&v=${body.imageVersion}`;

  await ref.update({
    imageUrl,
    imageVersion: body.imageVersion,
    updatedAt: FieldValue.serverTimestamp(),
  });

  res.status(200).json({ imageUrl });
});
