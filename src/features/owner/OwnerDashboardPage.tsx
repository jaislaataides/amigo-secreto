import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { Badge, Button, Card, Page, PageHeader } from "@/shared/components/ui";
import { EmptyState, ErrorBanner, FullPageSpinner } from "@/shared/components/Feedback";

interface PartyRow {
  id: string;
  name: string;
  status: string;
  imageUrl: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "rascunho",
  collecting: "coletando confirmações",
  ready_to_draw: "pronta pra sortear",
  drawn: "sorteada",
  canceled: "cancelada",
};

const STATUS_TONE: Record<string, "neutral" | "success" | "warning"> = {
  draft: "neutral",
  collecting: "warning",
  ready_to_draw: "warning",
  drawn: "success",
  canceled: "neutral",
};

export function OwnerDashboardPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["owner", "parties"],
    queryFn: () => api.get<{ parties: PartyRow[] }>("/api/parties"),
  });

  return (
    <Page>
      <PageHeader
        title="Minhas parties"
        actions={
          <Link to="/owner/parties/new">
            <Button>+ Nova party</Button>
          </Link>
        }
      />

      {isLoading && <FullPageSpinner />}
      {isError && <ErrorBanner message={error.message} />}

      {data && data.parties.length === 0 && (
        <EmptyState>Você ainda não criou nenhuma party. Que tal começar agora?</EmptyState>
      )}

      {data?.parties.map((party) => (
        <Link key={party.id} to={`/owner/parties/${party.id}/participants`} style={{ textDecoration: "none", color: "inherit" }}>
          <Card style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>{party.name}</strong>
            <Badge tone={STATUS_TONE[party.status] ?? "neutral"}>
              {STATUS_LABEL[party.status] ?? party.status}
            </Badge>
          </Card>
        </Link>
      ))}
    </Page>
  );
}
