import type { VercelRequest, VercelResponse } from "@vercel/node";
import { FieldValue } from "firebase-admin/firestore";
import { fetchOpenGraphPreview } from "../../_lib/linkPreview/fetchOg.js";
import { ApiError, verifyAuth } from "../../_lib/auth.js";
import { readJsonBody, requireString, withErrorHandling } from "../../_lib/http.js";
import { loadPartyOrThrow, requireParticipantAccess } from "../../_lib/party.js";

const MAX_LINKS = 10;

interface AddLinkBody {
  url: string;
}

export const handleMyLinks = withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  const decoded = await verifyAuth(req);
  const partyId = req.query.id;
  if (typeof partyId !== "string") throw new ApiError(400, "invalid-param", "Party inválida.");
  const { ref, party } = await loadPartyOrThrow(partyId);
  const { doc } = await requireParticipantAccess(req, ref, party, decoded);
  const linksCollection = doc.ref.collection("referenceLinks");

  if (req.method === "POST") {
    const body = readJsonBody<AddLinkBody>(req);
    const url = requireString(body.url, "url");

    const existing = await linksCollection.get();
    if (existing.size >= MAX_LINKS) {
      throw new ApiError(409, "too-many-links", `Máximo de ${MAX_LINKS} links de referência.`);
    }

    let preview;
    try {
      preview = await fetchOpenGraphPreview(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[link-preview] falha ao buscar preview de ${url}: ${message}`);
      preview = { title: null, imageUrl: null, description: null, domain: null };
    }

    const linkRef = await linksCollection.add({
      url,
      title: preview.title,
      imageUrl: preview.imageUrl,
      description: preview.description,
      domain: preview.domain,
      fetchedAt: FieldValue.serverTimestamp(),
      fetchStatus: preview.title || preview.imageUrl ? "ok" : "failed",
    });

    res.status(201).json({ id: linkRef.id });
    return;
  }

  if (req.method === "DELETE") {
    const linkId = req.query.linkId;
    if (typeof linkId !== "string") {
      throw new ApiError(400, "invalid-param", "linkId é obrigatório.");
    }
    await linksCollection.doc(linkId).delete();
    res.status(200).json({ ok: true });
    return;
  }

  res.setHeader("Allow", "POST, DELETE");
  res.status(405).json({ error: { code: "method-not-allowed", message: "Método não suportado." } });
});
