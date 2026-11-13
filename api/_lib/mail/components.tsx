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

const colors = {
  bg: "#f4f4f5",
  card: "#ffffff",
  text: "#18181b",
  muted: "#71717a",
  accent: "#b91c1c",
};

function Layout(props: { preview: string; children: React.ReactNode }) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{props.preview}</Preview>
      <Body style={{ backgroundColor: colors.bg, fontFamily: "system-ui, -apple-system, sans-serif", margin: 0, padding: "24px 0" }}>
        <Container style={{ backgroundColor: colors.card, borderRadius: 12, padding: 32, maxWidth: 480 }}>
          <Text style={{ color: colors.accent, fontWeight: 700, fontSize: 14, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 16px" }}>
            🎁 Amigo Secreto
          </Text>
          {props.children}
          <Hr style={{ borderColor: "#e4e4e7", margin: "24px 0" }} />
          <Text style={{ color: colors.muted, fontSize: 12, margin: 0 }}>
            Você recebeu este e-mail porque foi convidado(a) ou é organizador(a) de um Amigo Secreto nesta plataforma.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

function CtaButton(props: { href: string; children: React.ReactNode }) {
  return (
    <Button
      href={props.href}
      style={{
        backgroundColor: colors.accent,
        color: "#ffffff",
        padding: "12px 20px",
        borderRadius: 8,
        fontWeight: 600,
        textDecoration: "none",
        display: "inline-block",
      }}
    >
      {props.children}
    </Button>
  );
}

export function InviteEmail(props: { participantName: string; partyName: string; joinUrl: string }) {
  return (
    <Layout preview={`Você foi convidado para o Amigo Secreto "${props.partyName}"`}>
      <Heading style={{ fontSize: 20, color: colors.text, margin: "0 0 12px" }}>Olá, {props.participantName}!</Heading>
      <Text style={{ color: colors.text, fontSize: 15, lineHeight: 1.6 }}>
        Você foi convidado(a) para o Amigo Secreto <strong>{props.partyName}</strong>.
      </Text>
      <Section style={{ margin: "24px 0" }}>
        <CtaButton href={props.joinUrl}>Participar agora</CtaButton>
      </Section>
      <Text style={{ color: colors.muted, fontSize: 13 }}>
        Entre com a conta Google do e-mail que recebeu este convite.
      </Text>
    </Layout>
  );
}

export function ReminderEmail(props: { participantName: string; partyName: string; joinUrl: string }) {
  return (
    <Layout preview={`Lembrete: confirme sua presença em "${props.partyName}"`}>
      <Heading style={{ fontSize: 20, color: colors.text, margin: "0 0 12px" }}>Olá, {props.participantName}!</Heading>
      <Text style={{ color: colors.text, fontSize: 15, lineHeight: 1.6 }}>
        Ainda não vimos sua confirmação para o Amigo Secreto <strong>{props.partyName}</strong>.
      </Text>
      <Section style={{ margin: "24px 0" }}>
        <CtaButton href={props.joinUrl}>Confirmar presença</CtaButton>
      </Section>
    </Layout>
  );
}

export function RsvpAckEmail(props: { participantName: string; partyName: string; rsvp: string }) {
  const going = props.rsvp === "going";
  return (
    <Layout preview={`Confirmação recebida — "${props.partyName}"`}>
      <Heading style={{ fontSize: 20, color: colors.text, margin: "0 0 12px" }}>Olá, {props.participantName}!</Heading>
      <Text style={{ color: colors.text, fontSize: 15, lineHeight: 1.6 }}>
        Recebemos sua confirmação (<strong>{going ? "vou participar" : "não vou participar"}</strong>) para{" "}
        <strong>{props.partyName}</strong>.
      </Text>
      {going && (
        <Text style={{ color: colors.muted, fontSize: 14 }}>
          O resultado do seu sorteio chegará por aqui mesmo, num link pessoal e intransferível, assim que o sorteio
          for realizado.
        </Text>
      )}
    </Layout>
  );
}

export function RevealLinkEmail(props: { participantName: string; partyName: string; revealUrl: string }) {
  return (
    <Layout preview={`Seu resultado do Amigo Secreto "${props.partyName}" já está disponível!`}>
      <Heading style={{ fontSize: 20, color: colors.text, margin: "0 0 12px" }}>Olá, {props.participantName}!</Heading>
      <Text style={{ color: colors.text, fontSize: 15, lineHeight: 1.6 }}>
        O sorteio de <strong>{props.partyName}</strong> foi realizado!
      </Text>
      <Section style={{ margin: "24px 0" }}>
        <CtaButton href={props.revealUrl}>Ver quem eu tirei</CtaButton>
      </Section>
      <Text style={{ color: colors.muted, fontSize: 13 }}>
        Esse link é pessoal e intransferível — só funciona pra você, logado com este e-mail. Fica disponível por 15
        dias após o sorteio.
      </Text>
    </Layout>
  );
}

export function DrawDoneOwnerEmail(props: { partyName: string }) {
  return (
    <Layout preview={`Sorteio realizado — "${props.partyName}"`}>
      <Heading style={{ fontSize: 20, color: colors.text, margin: "0 0 12px" }}>Sorteio concluído!</Heading>
      <Text style={{ color: colors.text, fontSize: 15, lineHeight: 1.6 }}>
        O sorteio da sua party <strong>{props.partyName}</strong> foi concluído com sucesso. Os participantes
        confirmados já receberam o link de revelação por e-mail.
      </Text>
    </Layout>
  );
}

export function DrawInfeasibleOwnerEmail(props: { partyName: string; overConstrainedNames: string[] }) {
  return (
    <Layout preview={`Não foi possível sortear "${props.partyName}"`}>
      <Heading style={{ fontSize: 20, color: colors.text, margin: "0 0 12px" }}>Não foi possível sortear</Heading>
      <Text style={{ color: colors.text, fontSize: 15, lineHeight: 1.6 }}>
        O sorteio de <strong>{props.partyName}</strong> não pôde ser realizado com as exclusões atuais.
      </Text>
      <Text style={{ color: colors.text, fontSize: 15 }}>
        Participantes sem combinação possível: {props.overConstrainedNames.join(", ") || "—"}.
      </Text>
      <Text style={{ color: colors.muted, fontSize: 13 }}>
        Remova algumas restrições (ou aguarde mais confirmações) e tente novamente.
      </Text>
    </Layout>
  );
}
