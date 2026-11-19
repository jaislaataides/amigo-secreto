import { render } from "@react-email/render";
import type { MailTemplate } from "../../../shared/types.js";
import {
  DrawDoneOwnerEmail,
  DrawInfeasibleOwnerEmail,
  InviteEmail,
  ReminderEmail,
  RevealLinkEmail,
  RsvpAckEmail,
} from "./components.js";

export interface RenderedMail {
  subject: string;
  html: string;
}

export async function renderMailTemplate(
  template: MailTemplate,
  payload: Record<string, unknown>,
): Promise<RenderedMail> {
  switch (template) {
    case "invite": {
      const p = payload as { participantName: string; partyName: string; joinUrl: string };
      return {
        subject: `Você foi convidado(a) pro amigo secreto "${p.partyName}"`,
        html: await render(InviteEmail(p)),
      };
    }

    case "reminder": {
      const p = payload as { participantName: string; partyName: string; joinUrl: string };
      return {
        subject: `Lembrete: confirme sua presença em "${p.partyName}"`,
        html: await render(ReminderEmail(p)),
      };
    }

    case "rsvp_ack": {
      const p = payload as { participantName: string; partyName: string; rsvp: string };
      return {
        subject: `Confirmação recebida — "${p.partyName}"`,
        html: await render(RsvpAckEmail(p)),
      };
    }

    case "reveal_link": {
      const p = payload as { participantName: string; partyName: string; revealUrl: string };
      return {
        subject: `Saiu o sorteio de "${p.partyName}"! Veja quem você tirou`,
        html: await render(RevealLinkEmail(p)),
      };
    }

    case "draw_done_owner": {
      const p = payload as { partyName: string };
      return {
        subject: `Sorteio realizado — "${p.partyName}"`,
        html: await render(DrawDoneOwnerEmail(p)),
      };
    }

    case "draw_infeasible_owner": {
      const p = payload as { partyName: string; overConstrainedNames?: string[] };
      return {
        subject: `Não foi possível sortear "${p.partyName}"`,
        html: await render(DrawInfeasibleOwnerEmail({ ...p, overConstrainedNames: p.overConstrainedNames ?? [] })),
      };
    }

    default: {
      const exhaustiveCheck: never = template;
      throw new Error(`Unknown mail template: ${String(exhaustiveCheck)}`);
    }
  }
}
