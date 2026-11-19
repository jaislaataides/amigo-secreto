import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthContext";
import { api } from "@/shared/api/client";
import { EmptyState, ErrorBanner, InlineLoading } from "@/shared/components/Feedback";
import { Icon } from "@/shared/components/Icon";
import { ButtonLink, Page, PageHeader, Section } from "@/shared/components/ui";
import { PartyCard, useOwnerParties } from "@/features/owner/PartyCard";
import { FirstPartyOnboarding } from "@/features/owner/FirstPartyOnboarding";
import { Steps, type Step } from "@/shared/components/Steps";

const HOME_PARTY_LIMIT = 5;

export function HomePage() {
  const { user, role } = useAuth();
  // Admin tem acesso a tudo que um owner tem — organizar parties incluso.
  const canOrganize = role.owner || role.admin;
  const firstName = user?.displayName?.split(" ")[0];
  const title = firstName ? `Olá, ${firstName}!` : "Olá!";

  if (!canOrganize) {
    return (
      <Page maxWidth={960}>
        <PageHeader title={title} highlight={firstName} subtitle="Bom te ver por aqui." />
        <ParticipantHome />
      </Page>
    );
  }

  return (
    <Page maxWidth={960}>
      <OrganizerHome title={title} highlight={firstName} isAdmin={role.admin} />
    </Page>
  );
}

function OrganizerHome(props: { title: string; highlight?: string; isAdmin: boolean }) {
  const parties = useOwnerParties();
  const list = parties.data?.parties ?? [];
  const count = list.length;

  return (
    <>
      <PageHeader
        title={props.title}
        highlight={props.highlight}
        subtitle={
          parties.data
            ? count === 0
              ? "Você ainda não organizou nenhum amigo secreto."
              : `Você tem ${count} ${count === 1 ? "party" : "parties"}. Bora ver como andam?`
            : "O que você quer fazer hoje?"
        }
        actions={
          count > 0 ? (
            <ButtonLink to="/owner/parties/new" icon="plus">
              Nova party
            </ButtonLink>
          ) : undefined
        }
      />

      {props.isAdmin && <PendingRequestsNotice />}

      {parties.data && count === 0 ? (
        <FirstPartyOnboarding />
      ) : (
        <Section
          title="Suas parties"
          count={parties.data ? count : undefined}
          actions={
            count > HOME_PARTY_LIMIT ? (
              <Link to="/owner" className="small">
                Ver todas
              </Link>
            ) : undefined
          }
        >
          {parties.isLoading && <InlineLoading />}
          {parties.isError && <ErrorBanner message={parties.error.message} />}
          {parties.data && (
            <ul className="party-grid list">
              {list.slice(0, HOME_PARTY_LIMIT).map((party) => (
                <li key={party.id}>
                  <PartyCard party={party} />
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}
    </>
  );
}

/** Só aparece quando tem pedido de organizador esperando decisão. */
function PendingRequestsNotice() {
  const owners = useQuery({
    queryKey: ["admin", "owners"],
    queryFn: () => api.get<{ owners: { status: string }[] }>("/api/admin/owners"),
  });
  const pending = owners.data?.owners.filter((o) => o.status === "pending").length ?? 0;
  if (pending === 0) return null;

  return (
    <div className="card notice-card">
      <span className="home-link__icon">
        <Icon name="shield" size={22} />
      </span>
      <span className="notice-card__text">
        <strong>
          {pending} {pending === 1 ? "pedido de organizador" : "pedidos de organizador"}
        </strong>
        <span className="muted small"> esperando sua aprovação.</span>
      </span>
      <ButtonLink to="/admin" variant="secondary">
        Revisar
      </ButtonLink>
    </div>
  );
}

const STEPS: Step[] = [
  { icon: "check", title: "Confirme presença", text: "Pelo link do convite que chegou no seu e-mail." },
  { icon: "heart", title: "Deixe pistas", text: "Marque o que você curte e cole links de presentes." },
  { icon: "gift", title: "Abra seu papelzinho", text: "Depois do sorteio, um link só seu revela quem você tirou." },
];

/** Participante não tem lista de parties (o acesso é pelo link do e-mail). */
function ParticipantHome() {
  return (
    <>
      <EmptyState icon="mail" title="Procurando sua party?">
        Use o link que chegou no seu e-mail (convite ou resultado do sorteio).
      </EmptyState>

      <Section title="Como funciona">
        <Steps steps={STEPS} />
      </Section>

      <p className="muted small" style={{ marginTop: 24 }}>
        Quer organizar um amigo secreto? <Link to="/solicitar-acesso">Peça acesso de organizador</Link>.
      </p>
    </>
  );
}
