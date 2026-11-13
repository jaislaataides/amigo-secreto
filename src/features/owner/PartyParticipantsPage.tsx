import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { Badge, Button, Card, Input, Page, PageHeader } from "@/shared/components/ui";
import { EmptyState, ErrorBanner, FullPageSpinner } from "@/shared/components/Feedback";
import { PartyTabs } from "./PartyTabs";
import { usePartyDetail } from "./usePartyDetail";

interface Row {
  name: string;
  email: string;
}

const RSVP_LABEL: Record<string, string> = { pending: "aguardando", going: "vai", not_going: "não vai" };
const RSVP_TONE: Record<string, "neutral" | "success" | "warning"> = {
  pending: "warning",
  going: "success",
  not_going: "neutral",
};

export function PartyParticipantsPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const { data, isLoading, isError, error } = usePartyDetail(partyId);
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<Row[]>([{ name: "", email: "" }]);

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["owner", "party", partyId] });

  const addParticipants = useMutation({
    mutationFn: () =>
      api.post(`/api/parties/${partyId}/participants`, {
        participants: rows.filter((r) => r.name.trim() && r.email.trim()),
      }),
    onSuccess: () => {
      setRows([{ name: "", email: "" }]);
      invalidate();
    },
  });

  const removeParticipant = useMutation({
    mutationFn: (pid: string) => api.delete(`/api/parties/${partyId}/participants/${pid}`),
    onSuccess: invalidate,
  });

  if (!partyId) return null;
  if (isLoading) return <FullPageSpinner />;
  if (isError) return <ErrorBanner message={error.message} />;

  const count = data!.participants.length;
  const max = data!.maxParticipants;

  return (
    <Page>
      <PageHeader title={data!.name} subtitle={`${count} de ${max} participantes`} />
      <PartyTabs partyId={partyId} />

      {data!.participants.length === 0 && <EmptyState>Nenhum participante cadastrado ainda.</EmptyState>}
      {data!.participants.map((p) => (
        <Card key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong>{p.name}</strong> {p.isOwner && <Badge>organizador</Badge>}
            <div style={{ fontSize: 13, color: "#71717a" }}>{p.email}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Badge tone={RSVP_TONE[p.rsvp]}>{RSVP_LABEL[p.rsvp]}</Badge>
            {data!.status !== "drawn" && data!.status !== "canceled" && (
              <Button variant="danger" onClick={() => removeParticipant.mutate(p.id)}>
                Remover
              </Button>
            )}
          </div>
        </Card>
      ))}

      {data!.status !== "drawn" && data!.status !== "canceled" && count < max && (
        <>
          <h2 style={{ fontSize: 16, marginTop: 32 }}>Adicionar participantes</h2>
          {rows.map((row, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <Input
                placeholder="Nome"
                value={row.name}
                onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, name: e.target.value } : r)))}
              />
              <Input
                placeholder="E-mail"
                type="email"
                value={row.email}
                onChange={(e) => setRows(rows.map((r, j) => (j === i ? { ...r, email: e.target.value } : r)))}
              />
            </div>
          ))}
          {addParticipants.isError && <ErrorBanner message={addParticipants.error.message} />}
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" onClick={() => setRows([...rows, { name: "", email: "" }])}>
              + Mais uma linha
            </Button>
            <Button disabled={addParticipants.isPending} onClick={() => addParticipants.mutate()}>
              {addParticipants.isPending ? "Enviando convites…" : "Convidar"}
            </Button>
          </div>
        </>
      )}
    </Page>
  );
}
