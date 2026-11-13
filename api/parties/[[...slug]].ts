import type { VercelRequest, VercelResponse } from "@vercel/node";
import { listParties } from "./_handlers/list";
import { createParty } from "./_handlers/create";
import { getPartyDetail } from "./_handlers/detail";
import { runDraw } from "./_handlers/draw";
import { setExclusions } from "./_handlers/exclusions";
import { setCover } from "./_handlers/setCover";
import { setMaxParticipants } from "./_handlers/setMaxParticipants";
import { updateRules } from "./_handlers/updateRules";
import { getMe } from "./_handlers/meIndex";
import { setMyPreferences } from "./_handlers/mePreferences";
import { handleMyLinks } from "./_handlers/meLinks";
import { confirmRsvp } from "./_handlers/meConfirm";
import { addParticipants } from "./_handlers/participantsAdd";
import { removeParticipant } from "./_handlers/participantRemove";

/**
 * Roteador único pra tudo em /api/parties/** — o plano Hobby da Vercel
 * limita a 12 funções serverless por deploy, e /api/parties/* sozinho tinha
 * 14 arquivos de rota. Consolidar num catch-all (`[[...slug]]`) os junta
 * numa função só, sem mudar NENHUMA URL que o front já chama — a lógica de
 * cada rota continua intacta em api/parties/_handlers/*.ts (prefixo `_`
 * exclui esses arquivos do roteamento automático da Vercel).
 */
export default async function router(req: VercelRequest, res: VercelResponse) {
  const raw = req.query.slug;
  const slug = Array.isArray(raw) ? raw : raw ? [raw] : [];

  if (slug.length === 0) {
    return listParties(req, res);
  }

  if (slug.length === 1 && slug[0] === "create") {
    return createParty(req, res);
  }

  const [partyId, section, third] = slug;
  req.query.id = partyId;

  if (slug.length === 1) {
    return getPartyDetail(req, res);
  }

  if (slug.length === 2) {
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

  if (slug.length === 3) {
    if (section === "me") {
      switch (third) {
        case "preferences":
          return setMyPreferences(req, res);
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

  res.status(404).json({ error: { code: "not-found", message: "Rota não encontrada." } });
}
