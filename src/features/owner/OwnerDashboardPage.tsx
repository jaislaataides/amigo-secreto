import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { Badge, ButtonLink, Card, Page, PageHeader } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { EmptyState, ErrorBanner, FullPageSpinner } from "@/shared/components/Feedback";
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
    <Page>
      <PageHeader
        title="Minhas parties"
        subtitle="Seus amigos secretos, do convite ao sorteio."
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
        <Card flush>
          <ul className="list">
            {data.parties.map((party) => (
              <li key={party.id}>
                <Link to={`/owner/parties/${party.id}/participants`} className="party-row">
                  {party.imageUrl ? (
                    <img src={party.imageUrl} alt="" className="thumb" loading="lazy" />
                  ) : (
                    <span className="thumb" aria-hidden="true">
                      {initials(party.name)}
                    </span>
                  )}
                  <span className="party-row__main">
                    <span className="party-row__name">{party.name}</span>
                    <Badge tone={STATUS_TONE[party.status] ?? "neutral"}>
                      {STATUS_LABEL[party.status] ?? party.status}
                    </Badge>
                  </span>
                  <span className="party-row__chevron">
                    <Icon name="arrowRight" size={18} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </Page>
  );
}

function initials(name: string) {
  return name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
