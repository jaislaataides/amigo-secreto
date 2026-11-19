import type { ReactNode } from "react";
import { GeneratedCover } from "@/shared/components/GeneratedCover";
import { Page, PageHeader } from "@/shared/components/ui";
import { EmptyState, ErrorBanner, FullPageSpinner } from "@/shared/components/Feedback";
import { ApiClientError } from "@/shared/api/client";
import { ParticipantTabs } from "./ParticipantTabs";

/** Moldura das telas do participante: capa da party, título e abas. */
export function ParticipantLayout(props: {
  partyId: string;
  name: string;
  imageUrl: string | null;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Page>
      {props.imageUrl ? (
        <img src={props.imageUrl} alt="" className="cover" />
      ) : (
        <GeneratedCover seed={props.partyId} className="cover" ratio={3} />
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
          Por segurança, sua party só abre a partir do link do convite que chegou no seu e-mail, junto com o login na
          sua conta. Depois da primeira vez, este aparelho lembra. Não achou o e-mail? Peça pra quem organiza reenviar o
          convite.
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
