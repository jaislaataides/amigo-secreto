import { useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { Badge, Button, Card, Page, PageHeader } from "@/shared/components/ui";
import { ErrorBanner, FullPageSpinner } from "@/shared/components/Feedback";
import { ParticipantTabs } from "./ParticipantTabs";
import { useMyPartyView } from "./useMyPartyView";

export function ParticipantRsvpPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const { data, isLoading, isError, error } = useMyPartyView(partyId);
  const queryClient = useQueryClient();

  const confirm = useMutation({
    mutationFn: (rsvp: "going" | "not_going") => api.post(`/api/parties/${partyId}/me/confirm`, { rsvp }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["participant", "me", partyId] }),
  });

  if (!partyId) return null;
  if (isLoading) return <FullPageSpinner />;
  if (isError) return <ErrorBanner message={error.message} />;

  const { party, me } = data!;

  return (
    <Page>
      <PageHeader title={party.name} subtitle={party.description} />
      <ParticipantTabs partyId={partyId} />

      <Card>
        <p>
          Faixa de valor: <strong>R$ {party.valueRange.min}</strong> a <strong>R$ {party.valueRange.max}</strong>
        </p>
        {party.forbiddenItemsText && (
          <p style={{ color: "#71717a", fontSize: 14 }}>Evite: {party.forbiddenItemsText}</p>
        )}
      </Card>

      <h2 style={{ fontSize: 16 }}>Você vai participar?</h2>
      <p style={{ color: "#71717a", fontSize: 13, marginBottom: 16 }}>
        Se confirmar, o resultado do sorteio chegará pra você por e-mail, num link pessoal e intransferível — ninguém
        mais consegue abri-lo.
      </p>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <Button disabled={confirm.isPending} onClick={() => confirm.mutate("going")}>
          Vou participar
        </Button>
        <Button variant="secondary" disabled={confirm.isPending} onClick={() => confirm.mutate("not_going")}>
          Não vou participar
        </Button>
        {me.rsvp !== "pending" && (
          <Badge tone={me.rsvp === "going" ? "success" : "neutral"}>
            {me.rsvp === "going" ? "Você confirmou: vai" : "Você confirmou: não vai"}
          </Badge>
        )}
      </div>

      {confirm.isError && <ErrorBanner message={confirm.error.message} />}
    </Page>
  );
}
