import type { ReactNode } from "react";
import { Page, PageHeader } from "@/shared/components/ui";
import { ErrorBanner, FullPageSpinner } from "@/shared/components/Feedback";
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
      {props.imageUrl && <img src={props.imageUrl} alt="" className="cover" />}
      <PageHeader title={props.name} subtitle={props.subtitle} />
      <ParticipantTabs partyId={props.partyId} />
      {props.children}
    </Page>
  );
}

export function ParticipantLoadState(props: { isLoading: boolean; error: Error | null }) {
  if (props.isLoading) return <FullPageSpinner />;
  return (
    <Page>
      <ErrorBanner message={props.error?.message ?? "Não foi possível carregar a party."} />
    </Page>
  );
}
