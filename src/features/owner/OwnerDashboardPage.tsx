import { useAuth } from "@/auth/AuthContext";
import { EmptyState, ErrorBanner, InlineLoading } from "@/shared/components/Feedback";
import { ButtonLink, Page, PageHeader, Section } from "@/shared/components/ui";
import { FirstPartyOnboarding } from "./FirstPartyOnboarding";
import { InvitedPartyCard, PartyCard, useInvitedParties, useOwnerParties } from "./PartyCard";

/**
 * "Minhas parties": as que você criou (se for organizador) e as que você
 * foi convidado, com a sua resposta. Aberta pra qualquer pessoa logada.
 */
export function OwnerDashboardPage() {
  const { role } = useAuth();
  const canOrganize = role.owner || role.admin;

  const created = useOwnerParties(canOrganize);
  const invited = useInvitedParties();

  const createdList = created.data?.parties ?? [];
  const invitedList = invited.data?.parties ?? [];
  // Sem nenhuma party criada, o único botão de criar é o do onboarding.
  const hasCreated = createdList.length > 0;

  return (
    <Page maxWidth={960}>
      <PageHeader
        title="Minhas parties"
        highlight="parties"
        subtitle="As que você organiza e as que te convidaram."
        actions={
          canOrganize && hasCreated ? (
            <ButtonLink to="/owner/parties/new" icon="plus">
              Nova party
            </ButtonLink>
          ) : undefined
        }
      />

      {canOrganize && (
        <Section title="Criadas por você" count={created.data ? createdList.length : undefined}>
          {created.isLoading && <InlineLoading />}
          {created.isError && <ErrorBanner message={created.error.message} />}
          {created.data && !hasCreated && <FirstPartyOnboarding />}
          {hasCreated && (
            <ul className="party-grid list">
              {createdList.map((party) => (
                <li key={party.id}>
                  <PartyCard party={party} />
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      <Section title="Convites" count={invited.data ? invitedList.length : undefined}>
        {invited.isLoading && <InlineLoading />}
        {invited.isError && <ErrorBanner message={invited.error.message} />}
        {invited.data && invitedList.length === 0 && (
          <EmptyState icon="mail" title="Nenhum convite por enquanto">
            Quando alguém te chamar pra um amigo secreto, ele aparece aqui (e no seu e-mail).
          </EmptyState>
        )}
        {invitedList.length > 0 && (
          <ul className="party-grid list">
            {invitedList.map((party) => (
              <li key={party.id}>
                <InvitedPartyCard party={party} />
              </li>
            ))}
          </ul>
        )}
      </Section>
    </Page>
  );
}
