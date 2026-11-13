import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { Badge, Button, Card, Input, Page, PageHeader } from "@/shared/components/ui";
import { ErrorBanner, FullPageSpinner } from "@/shared/components/Feedback";
import { useAuth } from "@/auth/AuthContext";

interface AuthorizedOwnerRow {
  email: string;
  status: "pending" | "approved" | "rejected";
  requestedName?: string | null;
  requestedAt?: unknown;
}

interface PartyRow {
  id: string;
  name: string;
  ownerEmail: string;
  status: string;
  maxParticipants: number;
}

export function AdminDashboardPage() {
  const { signOutUser } = useAuth();
  const owners = useQuery({
    queryKey: ["admin", "owners"],
    queryFn: () => api.get<{ owners: AuthorizedOwnerRow[] }>("/api/admin/owners"),
  });
  const parties = useQuery({
    queryKey: ["admin", "parties"],
    queryFn: () => api.get<{ parties: PartyRow[] }>("/api/parties"),
  });

  return (
    <Page maxWidth={860}>
      <PageHeader
        title="Painel do admin"
        actions={
          <Button variant="secondary" onClick={() => void signOutUser()}>
            Sair
          </Button>
        }
      />

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Pedidos de acesso de organizador</h2>
        {owners.isLoading && <FullPageSpinner />}
        {owners.isError && <ErrorBanner message={owners.error.message} />}
        {owners.data && (
          <OwnersTable
            rows={owners.data.owners}
            onDecided={() => {
              void owners.refetch();
            }}
          />
        )}
      </section>

      <section>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Parties (ajustar limite de participantes)</h2>
        {parties.isLoading && <FullPageSpinner />}
        {parties.isError && <ErrorBanner message={parties.error.message} />}
        {parties.data && <PartiesTable rows={parties.data.parties} onChanged={() => void parties.refetch()} />}
      </section>
    </Page>
  );
}

function OwnersTable(props: { rows: AuthorizedOwnerRow[]; onDecided: () => void }) {
  const decide = useMutation({
    mutationFn: (input: { email: string; decision: "approved" | "rejected" }) =>
      api.post("/api/owners/approve", input),
    onSuccess: props.onDecided,
  });

  if (props.rows.length === 0) {
    return <p style={{ color: "#71717a", fontSize: 14 }}>Nenhum pedido ainda.</p>;
  }

  return (
    <>
      {props.rows.map((row) => (
        <Card key={row.email} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong>{row.requestedName || row.email}</strong>
            <div style={{ fontSize: 13, color: "#71717a" }}>{row.email}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <StatusBadge status={row.status} />
            {row.status === "pending" && (
              <>
                <Button
                  disabled={decide.isPending}
                  onClick={() => decide.mutate({ email: row.email, decision: "approved" })}
                >
                  Aprovar
                </Button>
                <Button
                  variant="danger"
                  disabled={decide.isPending}
                  onClick={() => decide.mutate({ email: row.email, decision: "rejected" })}
                >
                  Rejeitar
                </Button>
              </>
            )}
          </div>
        </Card>
      ))}
    </>
  );
}

function StatusBadge(props: { status: string }) {
  if (props.status === "approved") return <Badge tone="success">aprovado</Badge>;
  if (props.status === "rejected") return <Badge tone="danger">rejeitado</Badge>;
  return <Badge tone="warning">pendente</Badge>;
}

function PartiesTable(props: { rows: PartyRow[]; onChanged: () => void }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [value, setValue] = useState("");

  const setMax = useMutation({
    mutationFn: (input: { partyId: string; maxParticipants: number }) =>
      api.post(`/api/parties/${input.partyId}/set-max-participants`, { maxParticipants: input.maxParticipants }),
    onSuccess: () => {
      setEditing(null);
      props.onChanged();
      void queryClient.invalidateQueries({ queryKey: ["admin", "parties"] });
    },
  });

  if (props.rows.length === 0) {
    return <p style={{ color: "#71717a", fontSize: 14 }}>Nenhuma party criada ainda.</p>;
  }

  return (
    <>
      {props.rows.map((row) => (
        <Card key={row.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong>{row.name}</strong>
            <div style={{ fontSize: 13, color: "#71717a" }}>
              {row.ownerEmail} · status: {row.status}
            </div>
          </div>
          {editing === row.id ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Input
                type="number"
                min={1}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                style={{ width: 80 }}
              />
              <Button
                disabled={setMax.isPending}
                onClick={() => setMax.mutate({ partyId: row.id, maxParticipants: Number(value) })}
              >
                Salvar
              </Button>
              <Button variant="secondary" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              onClick={() => {
                setEditing(row.id);
                setValue(String(row.maxParticipants));
              }}
            >
              Limite: {row.maxParticipants}
            </Button>
          )}
        </Card>
      ))}
    </>
  );
}
