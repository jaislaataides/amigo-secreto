import { ButtonLink, Page, PageHeader } from "@/shared/components/ui";
import { PartyCard, useOwnerParties } from "./PartyCard";
import { ErrorBanner, FullPageSpinner } from "@/shared/components/Feedback";
import { FirstPartyOnboarding } from "./FirstPartyOnboarding";

export function OwnerDashboardPage() {
  const { data, isLoading, isError, error } = useOwnerParties();
  // Sem nenhuma party, o único botão de criar é o do onboarding.
  const hasParties = (data?.parties.length ?? 0) > 0;

  return (
    <Page maxWidth={960}>
      <PageHeader
        title="Minhas parties"
        highlight="parties"
        subtitle="Seus amigos secretos, do convite ao sorteio — sem mico."
        actions={
          hasParties ? (
            <ButtonLink to="/owner/parties/new" icon="plus">
              Nova party
            </ButtonLink>
          ) : undefined
        }
      />

      {isLoading && <FullPageSpinner />}
      {isError && <ErrorBanner message={error.message} />}

      {data && !hasParties && <FirstPartyOnboarding />}

      {data && data.parties.length > 0 && (
        <ul className="party-grid list">
          {data.parties.map((party) => (
            <li key={party.id}>
              <PartyCard party={party} />
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
