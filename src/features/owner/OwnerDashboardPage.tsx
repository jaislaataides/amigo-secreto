import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { Badge, ButtonLink, Page, PageHeader } from "@/shared/components/ui";
import { EmptyState, ErrorBanner, FullPageSpinner } from "@/shared/components/Feedback";
import { Icon } from "@/shared/components/Icon";
import { STATUS_LABEL, STATUS_TONE } from "./partyStatus";

interface PartyRow {
  id: string;
  name: string;
  status: string;
  imageUrl: string | null;
}

export function OwnerDashboardPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["owner", "parties"],
    queryFn: () => api.get<{ parties: PartyRow[] }>("/api/parties"),
  });

  return (
    <Page maxWidth={960}>
      <PageHeader
        title="Minhas parties"
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
              <Link to={`/owner/parties/${party.id}/participants`} className="card card--flush card--interactive">
                {party.imageUrl && <img src={party.imageUrl} alt="" className="party-card__cover" loading="lazy" />}
                <div className="party-card__body">
                  {!party.imageUrl && (
                    <span className="home-link__icon" style={{ marginBottom: 4 }}>
                      <Icon name="gift" size={22} />
                    </span>
                  )}
                  <span className="party-card__name">{party.name}</span>
                  <Badge tone={STATUS_TONE[party.status] ?? "neutral"}>{STATUS_LABEL[party.status] ?? party.status}</Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
