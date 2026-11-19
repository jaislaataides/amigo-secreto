import { ButtonLink, Page, PageHeader } from "@/shared/components/ui";
import { PartyCard, useOwnerParties } from "./PartyCard";
import { EmptyState, ErrorBanner, FullPageSpinner } from "@/shared/components/Feedback";

export function OwnerDashboardPage() {
  const { data, isLoading, isError, error } = useOwnerParties();

  return (
    <Page maxWidth={960}>
      <PageHeader
        title="Minhas parties"
        highlight="parties"
        subtitle="Seus amigos secretos, do convite ao sorteio — sem mico."
        actions={
          <ButtonLink to="/owner/parties/new" icon="plus">
            Nova party
          </ButtonLink>
        }
      />

      {isLoading && <FullPageSpinner />}
      {isError && <ErrorBanner message={error.message} />}

      {data && data.parties.length === 0 && (
        <EmptyState
          title="Nenhuma party ainda"
          action={
            <ButtonLink to="/owner/parties/new" icon="plus">
              Criar minha primeira party
            </ButtonLink>
          }
        >
          Crie uma party, convide o grupo por e-mail e deixe o sorteio com a gente.
        </EmptyState>
      )}

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
