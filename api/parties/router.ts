import type { VercelRequest, VercelResponse } from "@vercel/node";
import { listParties } from "./_handlers/list.js";
import { listInvitedParties } from "./_handlers/listInvited.js";
import { createParty } from "./_handlers/create.js";
import { getPartyDetail } from "./_handlers/detail.js";
import { runDraw } from "./_handlers/draw.js";
import { setExclusions } from "./_handlers/exclusions.js";
import { setCover } from "./_handlers/setCover.js";
import { setMaxParticipants } from "./_handlers/setMaxParticipants.js";
import { updateRules } from "./_handlers/updateRules.js";
import { getMe } from "./_handlers/meIndex.js";
import { setMyPreferences } from "./_handlers/mePreferences.js";
import { setMySizes } from "./_handlers/meSizes.js";
import { handleMyLinks } from "./_handlers/meLinks.js";
import { confirmRsvp } from "./_handlers/meConfirm.js";
import { addParticipants } from "./_handlers/participantsAdd.js";
import { removeParticipant } from "./_handlers/participantRemove.js";
import { resendInvite } from "./_handlers/participantResend.js";

/**
 * Roteador único pra tudo em /api/parties/** — um arquivo sem colchetes,
 * mapeado via rewrite no vercel.json (`/api/parties/:path*` ->
 * `/api/parties/router`). Fizemos assim (em vez de um arquivo
 * `[...slug].ts`) porque a combinação de um `index.ts` + um catch-all de
 * colchete no MESMO diretório não estava recebendo os segmentos certos em
 * produção (`/api/parties/create` caía direto no 404 do fallback) — com o
 * rewrite, a gente mesmo faz o parse de `req.url`, sem depender da
 * inferência de rotas por pastas da Vercel pra esse caso específico.
 *
 * Isso junta numa função só o que eram 14 arquivos de rota (o plano Hobby
 * da Vercel limita a 12 funções por deploy) — nenhuma URL que o front já
 * chama muda; a lógica de cada rota continua intacta em
 * api/parties/_handlers/*.ts (prefixo `_` exclui esses arquivos do
 * roteamento automático da Vercel).
 */
export default async function router(req: VercelRequest, res: VercelResponse) {
  const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
  const segments = pathname.replace(/^\/api\/parties\/?/, "").split("/").filter(Boolean);

  if (segments.length === 0) {
    return listParties(req, res);
  }

  if (segments.length === 1 && segments[0] === "create") {
    return createParty(req, res);
  }

  // Antes do "/:partyId": ids do Firestore nunca são "invited".
  if (segments.length === 1 && segments[0] === "invited") {
    return listInvitedParties(req, res);
  }

  const [partyId, section, third] = segments;
  req.query.id = partyId;

  if (segments.length === 1) {
    return getPartyDetail(req, res);
  }

  if (segments.length === 2) {
    switch (section) {
      case "draw":
        return runDraw(req, res);
      case "exclusions":
        return setExclusions(req, res);
      case "set-cover":
        return setCover(req, res);
      case "set-max-participants":
        return setMaxParticipants(req, res);
      case "update-rules":
        return updateRules(req, res);
      case "me":
        return getMe(req, res);
      case "participants":
        return addParticipants(req, res);
    }
  }

  if (segments.length === 3) {
    if (section === "me") {
      switch (third) {
        case "preferences":
          return setMyPreferences(req, res);
        case "sizes":
          return setMySizes(req, res);
        case "links":
          return handleMyLinks(req, res);
        case "confirm":
          return confirmRsvp(req, res);
      }
    }
    if (section === "participants") {
      req.query.pid = third;
      return removeParticipant(req, res);
    }
  }

  if (segments.length === 4 && section === "participants" && segments[3] === "resend") {
    req.query.pid = third;
    return resendInvite(req, res);
  }

  res.status(404).json({ error: { code: "not-found", message: "Rota não encontrada." } });
}
