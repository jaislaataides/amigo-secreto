import type { ReactNode } from "react";
import { GeneratedCover } from "@/shared/components/GeneratedCover";
import { Page, PageHeader, ButtonLink } from "@/shared/components/ui";
import { EmptyState, ErrorBanner, FullPageSpinner } from "@/shared/components/Feedback";
import { ApiClientError } from "@/shared/api/client";
import { ParticipantTabs } from "./ParticipantTabs";

/** Moldura das telas do participante: capa da party, título e abas. */
export function ParticipantLayout(props: {
  partyId: string;
  name: string;
  imageUrl: string | null;
  subtitle?: ReactNode;
  /** Mostra um link de volta pro painel de organizador (quem criou a party também é participante dela). */
  isOwner?: boolean;
  children: ReactNode;
}) {
  return (
    <Page>
      {props.imageUrl ? (
        <img src={props.imageUrl} alt="" className="cover" />
      ) : (
        <GeneratedCover seed={props.partyId} className="cover" ratio={3} />
      )}
      {props.isOwner && (
        <div style={{ marginBottom: 12 }}>
          <ButtonLink to={`/owner/parties/${props.partyId}/participants`} variant="secondary" size="sm" icon="arrowLeft">
            Voltar pro painel da party
          </ButtonLink>
        </div>
      )}
      <PageHeader title={props.name} subtitle={props.subtitle} />
      <ParticipantTabs partyId={props.partyId} />
      {props.children}
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
