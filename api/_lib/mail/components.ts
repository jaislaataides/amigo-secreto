import { createElement as h, type ReactNode } from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

// Sem JSX de propósito (arquivo .ts, não .tsx): o bundler de funções da
// Vercel não estava compilando/rastreando corretamente um .tsx que não é
// uma rota diretamente — dava ERR_MODULE_NOT_FOUND em produção mesmo
// existindo no repositório. React.createElement equivale 1:1 ao JSX.

// Mesma paleta do app (src/app/global.css), tema claro.
const colors = {
  bg: "#f8f6fb",
  card: "#ffffff",
  text: "#1f1a2b",
  muted: "#5f5873",
  accent: "#6d28d9",
  border: "#e4ddee",
};

function Layout(props: { preview: string; children?: ReactNode }) {
  return h(
    Html,
    { lang: "pt-BR" },
    h(Head),
    h(Preview, null, props.preview),
    h(
      Body,
      { style: { backgroundColor: colors.bg, fontFamily: "system-ui, -apple-system, sans-serif", margin: 0, padding: "24px 0" } },
      h(
        Container,
        { style: { backgroundColor: colors.card, borderRadius: 12, padding: 32, maxWidth: 480 } },
        h(
          Text,
          {
            style: {
              color: colors.accent,
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: 1,
              textTransform: "uppercase",
              margin: "0 0 16px",
            },
          },
          "Amico Secreto",
        ),
        props.children,
        h(Hr, { style: { borderColor: colors.border, margin: "24px 0" } }),
        h(
          Text,
          { style: { color: colors.muted, fontSize: 12, margin: 0 } },
          "Você recebeu este e-mail porque participa ou organiza um amigo secreto no Amico Secreto.",
        ),
      ),
    ),
  );
}

function CtaButton(props: { href: string; children?: ReactNode }) {
  return h(
    Button,
    {
      href: props.href,
      style: {
        backgroundColor: colors.accent,
        color: "#ffffff",
        padding: "12px 20px",
        borderRadius: 999,
        fontWeight: 700,
        textDecoration: "none",
        display: "inline-block",
      },
    },
    props.children,
  );
}

function Heading20(children: ReactNode) {
  return h(Heading, { style: { fontSize: 20, color: colors.text, margin: "0 0 12px" } }, children);
}

function Paragraph(children: ReactNode) {
  return h(Text, { style: { color: colors.text, fontSize: 15, lineHeight: 1.6 } }, children);
}

function MutedParagraph(children: ReactNode, fontSize = 13) {
  return h(Text, { style: { color: colors.muted, fontSize } }, children);
}

export function InviteEmail(props: { participantName: string; partyName: string; joinUrl: string }) {
  return h(
    Layout,
    { preview: `Você foi convidado(a) pro amigo secreto "${props.partyName}"` },
    Heading20(`Olá, ${props.participantName}!`),
    Paragraph(h("span", null, "Você foi convidado(a) pro amigo secreto ", h("strong", null, props.partyName), ".")),
    Paragraph(
      "Lá você confirma presença, marca o que curte ganhar e deixa referências, pra ninguém pagar mico no presente.",
    ),
    h(Section, { style: { margin: "24px 0" } }, h(CtaButton, { href: props.joinUrl }, "Participar agora")),
    MutedParagraph("Entre com a conta Google do e-mail que recebeu este convite."),
  );
}

export function ReminderEmail(props: { participantName: string; partyName: string; joinUrl: string }) {
  return h(
    Layout,
    { preview: `Lembrete: confirme sua presença em "${props.partyName}"` },
    Heading20(`Olá, ${props.participantName}!`),
    Paragraph(
      h("span", null, "Ainda não vimos sua confirmação pro amigo secreto ", h("strong", null, props.partyName), "."),
    ),
    h(Section, { style: { margin: "24px 0" } }, h(CtaButton, { href: props.joinUrl }, "Confirmar presença")),
  );
}

export function RsvpAckEmail(props: { participantName: string; partyName: string; rsvp: string }) {
  const going = props.rsvp === "going";
  return h(
    Layout,
    { preview: `Confirmação recebida — "${props.partyName}"` },
    Heading20(`Olá, ${props.participantName}!`),
    Paragraph(
      h(
        "span",
        null,
        "Recebemos sua confirmação (",
        h("strong", null, going ? "vou participar" : "não vou participar"),
        ") para ",
        h("strong", null, props.partyName),
        ".",
      ),
    ),
    going
      ? MutedParagraph(
          "O resultado do seu sorteio chegará por aqui mesmo, num link pessoal e intransferível, assim que o sorteio for realizado.",
          14,
        )
      : null,
  );
}

export function RevealLinkEmail(props: { participantName: string; partyName: string; revealUrl: string }) {
  return h(
    Layout,
    { preview: `Saiu o sorteio de "${props.partyName}"! Veja quem você tirou` },
    Heading20(`Olá, ${props.participantName}!`),
    Paragraph(h("span", null, "O sorteio de ", h("strong", null, props.partyName), " foi realizado!")),
    h(Section, { style: { margin: "24px 0" } }, h(CtaButton, { href: props.revealUrl }, "Ver quem eu tirei")),
    MutedParagraph(
      "Esse link é pessoal e intransferível: só funciona pra você, logado com este e-mail. Abra longe de olhares curiosos pra não pagar mico. Fica disponível por 15 dias após o sorteio.",
    ),
  );
}

export function DrawDoneOwnerEmail(props: { partyName: string }) {
  return h(
    Layout,
    { preview: `Sorteio realizado — "${props.partyName}"` },
    Heading20("Sorteio concluído!"),
    Paragraph(
      h(
        "span",
        null,
        "O sorteio da sua party ",
        h("strong", null, props.partyName),
        " foi concluído com sucesso. Os participantes confirmados já receberam o link de revelação por e-mail.",
      ),
    ),
  );
}

export function DrawInfeasibleOwnerEmail(props: { partyName: string; overConstrainedNames: string[] }) {
  return h(
    Layout,
    { preview: `Não foi possível sortear "${props.partyName}"` },
    Heading20("Não foi possível sortear"),
    Paragraph(
      h("span", null, "O sorteio de ", h("strong", null, props.partyName), " não pôde ser realizado com as exclusões atuais."),
    ),
    h(Text, { style: { color: colors.text, fontSize: 15 } }, `Participantes sem combinação possível: ${props.overConstrainedNames.join(", ") || "—"}.`),
    MutedParagraph("Remova algumas restrições (ou aguarde mais confirmações) e tente novamente."),
  );
}
