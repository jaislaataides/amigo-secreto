import type { ReactNode } from "react";
import { Badge, Page, PageHeader } from "@/shared/components/ui";
import { ErrorBanner, FullPageSpinner } from "@/shared/components/Feedback";
import { PartyTabs } from "./PartyTabs";
import { PARTY_BACK, STATUS_LABEL, STATUS_TONE } from "./partyStatus";

/** Moldura comum das telas de uma party: voltar, título, status e abas. */
export function PartyLayout(props: {
  partyId: string;
  name: string;
  status: string;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Page>
      <PageHeader
        back={PARTY_BACK}
        title={props.name}
        subtitle={props.subtitle}
        actions={
          <Badge tone={STATUS_TONE[props.status] ?? "neutral"}>{STATUS_LABEL[props.status] ?? props.status}</Badge>
        }
      />
      <PartyTabs partyId={props.partyId} />
      {props.children}
    </Page>
  );
}

export function PartyLoadState(props: { isLoading: boolean; error: Error | null }) {
  if (props.isLoading) return <FullPageSpinner />;
  return (
    <Page>
      <ErrorBanner message={props.error?.message ?? "Não foi possível carregar a party."} />
    </Page>
  );
}
