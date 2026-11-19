import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchOpenGraphPreview } from "./_lib/linkPreview/fetchOg.js";
import { ApiError, requireMethod, verifyAuth } from "./_lib/auth.js";
import { readJsonBody, requireString, withErrorHandling } from "./_lib/http.js";

interface LinkPreviewBody {
  url: string;
}

/** POST /api/link-preview — preview ao vivo antes de salvar (não persiste nada). */
export default withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  if (!requireMethod(req, res, ["POST"])) return;
  await verifyAuth(req);

  const body = readJsonBody<LinkPreviewBody>(req);
  const url = requireString(body.url, "url");

  try {
    const preview = await fetchOpenGraphPreview(url);
    res.status(200).json(preview);
  } catch (err) {
    throw new ApiError(422, "preview-failed", err instanceof Error ? err.message : "Não foi possível gerar o preview.");
  }
});
