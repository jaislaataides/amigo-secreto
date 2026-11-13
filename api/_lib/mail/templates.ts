import type { MailTemplate } from "../../../shared/types";

export interface RenderedMail {
  subject: string;
  html: string;
}

// Templates simples (string literals). Trocar por componentes
// @react-email/components + @react-email/render é puramente cosmético —
// a assinatura de renderMailTemplate() não muda, então o resto do código
// (send.ts e as rotas que chamam enqueueAndSend) não precisa ser tocado.
export function renderMailTemplate(
  template: MailTemplate,
  payload: Record<string, unknown>,
): RenderedMail {
  switch (template) {
    case "invite":
      return {
        subject: `Você foi convidado para o Amigo Secreto "${payload.partyName}"`,
        html: `
          <p>Olá, ${payload.participantName}!</p>
          <p>Você foi convidado(a) para o Amigo Secreto <strong>${payload.partyName}</strong>.</p>
          <p><a href="${payload.joinUrl}">Clique aqui para participar</a></p>
          <p>Entre com a conta Google do e-mail que recebeu este convite.</p>
        `,
      };

    case "reminder":
      return {
        subject: `Lembrete: confirme sua presença em "${payload.partyName}"`,
        html: `
          <p>Olá, ${payload.participantName}!</p>
          <p>Ainda não vimos sua confirmação para o Amigo Secreto <strong>${payload.partyName}</strong>.</p>
          <p><a href="${payload.joinUrl}">Confirmar presença agora</a></p>
        `,
      };

    case "rsvp_ack": {
      const going = payload.rsvp === "going";
      return {
        subject: `Confirmação recebida — "${payload.partyName}"`,
        html: `
          <p>Olá, ${payload.participantName}!</p>
          <p>Recebemos sua confirmação (<strong>${going ? "vou participar" : "não vou participar"}</strong>) para "${payload.partyName}".</p>
          ${going ? "<p>O resultado do seu sorteio chegará por aqui mesmo, num link pessoal e intransferível, assim que o sorteio for realizado.</p>" : ""}
        `,
      };
    }

    case "reveal_link":
      return {
        subject: `Seu resultado do Amigo Secreto "${payload.partyName}" já está disponível!`,
        html: `
          <p>Olá, ${payload.participantName}!</p>
          <p>O sorteio de <strong>${payload.partyName}</strong> foi realizado.</p>
          <p><a href="${payload.revealUrl}">Clique aqui para ver quem você tirou</a></p>
          <p>Esse link é pessoal e intransferível — só funciona pra você, logado com este e-mail.</p>
          <p><small>O resultado fica disponível por 15 dias após o sorteio.</small></p>
        `,
      };

    case "draw_done_owner":
      return {
        subject: `Sorteio realizado — "${payload.partyName}"`,
        html: `
          <p>O sorteio da sua party <strong>${payload.partyName}</strong> foi concluído com sucesso.</p>
          <p>Os participantes confirmados já receberam o link de revelação por e-mail.</p>
        `,
      };

    case "draw_infeasible_owner": {
      const names = (payload.overConstrainedNames as string[] | undefined) ?? [];
      return {
        subject: `Não foi possível sortear "${payload.partyName}"`,
        html: `
          <p>O sorteio de <strong>${payload.partyName}</strong> não pôde ser realizado com as exclusões atuais.</p>
          <p>Participantes sem combinação possível: ${names.join(", ") || "—"}.</p>
          <p>Remova algumas restrições (ou aguarde mais confirmações) e tente novamente.</p>
        `,
      };
    }

    default: {
      const exhaustiveCheck: never = template;
      throw new Error(`Unknown mail template: ${String(exhaustiveCheck)}`);
    }
  }
}
