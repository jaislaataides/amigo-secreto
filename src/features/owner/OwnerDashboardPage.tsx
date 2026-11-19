import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { ButtonLink, Page, PageHeader, Status } from "@/shared/components/ui";
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
    <Page>
      <PageHeader title="Minhas parties" actions={<ButtonLink to="/owner/parties/new">Nova party</ButtonLink>} />

      {isLoading && <FullPageSpinner />}
      {isError && <ErrorBanner message={error.message} />}

      {data && data.parties.length === 0 && (
        <EmptyState
          title="Nenhuma party ainda"
          action={<ButtonLink to="/owner/parties/new">Criar a primeira</ButtonLink>}
        >
          Crie uma party, convide o grupo por e-mail e deixe o sorteio com a gente.
        </EmptyState>
      )}

      {data && data.parties.length > 0 && (
        <ul className="rows">
          {data.parties.map((party) => (
            <li key={party.id}>
              <Link to={`/owner/parties/${party.id}/participants`} className="row-item">
                {party.imageUrl && <img src={party.imageUrl} alt="" className="row-item__thumb" loading="lazy" />}
                <div className="row-item__main">
                  <div className="row-item__title">{party.name}</div>
                  <Status tone={STATUS_TONE[party.status] ?? "neutral"}>
                    {STATUS_LABEL[party.status] ?? party.status}
                  </Status>
                </div>
                <Icon name="arrowRight" size={18} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Page>
  );
}
