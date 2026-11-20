import type { ReactNode } from "react";
import { GeneratedCover } from "@/shared/components/GeneratedCover";
import { Badge, Card, Page, PageHeader } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { EmptyState, ErrorBanner, FullPageSpinner } from "@/shared/components/Feedback";
import { ApiClientError } from "@/shared/api/client";
import { ParticipantTabs } from "./ParticipantTabs";

/** Moldura das telas do participante: capa da party, título e abas. */
export function ParticipantLayout(props: {
  partyId: string;
  name: string;
  imageUrl: string | null;
  subtitle?: ReactNode;
  /** Quem criou a party também é participante dela — mostra um link de volta pro painel de organizador. */
  isOwner?: boolean;
  /** Sorteio já feito: trava tudo, não dá mais pra editar nada daqui. */
  partyStatus: string;
  /** Só pra mostrar na tela de "sorteio realizado" — quem entrou no sorteio. */
  participants: { name: string }[];
  children: ReactNode;
}) {
  const drawn = props.partyStatus === "drawn";
  return (
    <Page>
      {props.imageUrl ? (
        <img src={props.imageUrl} alt="" className="cover" />
      ) : (
        <GeneratedCover seed={props.partyId} className="cover" ratio={3} />
      )}
      {!drawn && (
        // Essas páginas são sobre a pessoa (categorias, referências, medidas), não
        // sobre as regras da party — fácil de confundir pra quem também organiza.
        <p className="hint" style={{ margin: "4px 0" }}>Suas informações pessoais nesta party</p>
      )}
      <PageHeader
        back={props.isOwner ? { to: `/owner/parties/${props.partyId}/participants`, label: "Painel da party" } : undefined}
        title={props.name}
        subtitle={props.subtitle}
      />
      {drawn ? (
        <>
          <Card>
            <div className="home-link" style={{ alignItems: "flex-start" }}>
              <span className="home-link__icon">
                <Icon name="lock" size={24} strokeWidth={2.5} />
              </span>
              <div>
                <h2 className="section-title" style={{ margin: 0 }}>
                  Sorteio realizado!
                </h2>
                <p className="muted" style={{ marginTop: 4 }}>
                  Verifique seu e-mail — o resultado chegou num link pessoal. Não dá mais pra editar nada por aqui.
                </p>
              </div>
            </div>
          </Card>
          {props.participants.length > 0 && (
            <section style={{ marginTop: 24 }}>
              <h2 className="section-title">
                Quem participou <span className="count">{props.participants.length}</span>
              </h2>
              <div className="row" style={{ gap: 6 }}>
                {props.participants.map((p) => (
                  <Badge key={p.name}>{p.name}</Badge>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <>
          <ParticipantTabs partyId={props.partyId} />
          {props.children}
        </>
      )}
    </Page>
  );
}

export function ParticipantLoadState(props: { isLoading: boolean; error: Error | null }) {
  if (props.isLoading) return <FullPageSpinner />;
  if (props.error instanceof ApiClientError && props.error.code === "link-required") {
    return (
      <Page maxWidth={560}>
        <EmptyState icon="mail" title="Abra pelo link do seu e-mail">
          Por segurança, a primeira vez precisa ser pelo link do convite que chegou no seu e-mail. Depois disso é só
          entrar com a sua conta, em qualquer aparelho. Não achou o e-mail? Peça pra quem organiza reenviar o convite.
        </EmptyState>
      </Page>
    );
  }
  return (
    <Page>
      <ErrorBanner message={props.error?.message ?? "Não foi possível carregar a party."} />
    </Page>
  );
}
