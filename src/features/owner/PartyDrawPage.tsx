import { useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiClientError } from "@/shared/api/client";
import { Badge, Button, Card, Page, PageHeader } from "@/shared/components/ui";
import { ErrorBanner, FullPageSpinner } from "@/shared/components/Feedback";
import { PartyTabs } from "./PartyTabs";
import { usePartyDetail } from "./usePartyDetail";

export function PartyDrawPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const { data, isLoading, isError, error } = usePartyDetail(partyId);
  const queryClient = useQueryClient();

  const draw = useMutation({
    mutationFn: () => api.post<{ assignedCount: number }>(`/api/parties/${partyId}/draw`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["owner", "party", partyId] }),
  });

  if (!partyId) return null;
  if (isLoading) return <FullPageSpinner />;
  if (isError) return <ErrorBanner message={error.message} />;

  const going = data!.participants.filter((p) => p.rsvp === "going").length;
  const pending = data!.participants.filter((p) => p.rsvp === "pending").length;
  const alreadyDrawn = data!.status === "drawn";

  return (
    <Page>
      <PageHeader title={data!.name} />
      <PartyTabs partyId={partyId} />

      <Card>
        <p>
          <strong>{going}</strong> confirmados, <strong>{pending}</strong> aguardando resposta.
        </p>
        {alreadyDrawn ? (
          <Badge tone="success">Sorteio já realizado</Badge>
        ) : pending === 0 ? (
          <Badge tone="success">Todo mundo respondeu — pronto pra sortear</Badge>
        ) : (
          <Badge tone="warning">
            Ainda dá pra sortear forçado após o prazo de confirmação, com pelo menos 3 confirmados
          </Badge>
        )}
      </Card>

      {!alreadyDrawn && (
        <>
          {draw.isError && (
            <ErrorBanner
              message={draw.error instanceof ApiClientError ? draw.error.message : "Erro ao realizar o sorteio."}
            />
          )}
          <Button disabled={draw.isPending || going < 3} onClick={() => draw.mutate()}>
            {draw.isPending ? "Sorteando…" : "Realizar sorteio"}
          </Button>
          {going < 3 && (
            <p style={{ color: "#71717a", fontSize: 13, marginTop: 8 }}>
              É preciso de pelo menos 3 participantes confirmados.
            </p>
          )}
        </>
      )}

      {draw.isSuccess && (
        <p style={{ color: "#166534", marginTop: 12 }}>
          Sorteio realizado! {draw.data.assignedCount} participantes receberam o link de revelação por e-mail.
        </p>
      )}
    </Page>
  );
}
