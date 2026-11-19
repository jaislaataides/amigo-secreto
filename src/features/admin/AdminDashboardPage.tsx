import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { Avatar, Badge, Button, Card, Input, Page, PageHeader, Section } from "@/shared/components/ui";
import { STATUS_LABEL, STATUS_TONE } from "@/features/owner/partyStatus";
import { EmptyState, ErrorBanner, InlineLoading } from "@/shared/components/Feedback";

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
  const owners = useQuery({
    queryKey: ["admin", "owners"],
    queryFn: () => api.get<{ owners: AuthorizedOwnerRow[] }>("/api/admin/owners"),
  });
  const parties = useQuery({
    queryKey: ["admin", "parties"],
    queryFn: () => api.get<{ parties: PartyRow[] }>("/api/parties"),
  });

  const pendingCount = owners.data?.owners.filter((o) => o.status === "pending").length;

  return (
    <Page maxWidth={860}>
      <PageHeader title="Painel do admin" highlight="admin" subtitle="Aprove organizadores e ajuste o tamanho das parties." />

      <Section title="Pedidos de organizador" count={pendingCount}>
        {owners.isLoading && <InlineLoading />}
        {owners.isError && <ErrorBanner message={owners.error.message} />}
        {owners.data && (
          <OwnersTable
            rows={owners.data.owners}
            onDecided={() => {
              void owners.refetch();
            }}
          />
        )}
      </Section>

      <Section title="Parties" count={parties.data?.parties.length}>
        {parties.isLoading && <InlineLoading />}
        {parties.isError && <ErrorBanner message={parties.error.message} />}
        {parties.data && <PartiesTable rows={parties.data.parties} onChanged={() => void parties.refetch()} />}
      </Section>
    </Page>
  );
}

const ORDER: Record<AuthorizedOwnerRow["status"], number> = { pending: 0, approved: 1, rejected: 2 };

function OwnersTable(props: { rows: AuthorizedOwnerRow[]; onDecided: () => void }) {
  const decide = useMutation({
    mutationFn: (input: { email: string; decision: "approved" | "rejected" }) =>
      api.post("/api/owners/approve", input),
    onSuccess: props.onDecided,
  });

  if (props.rows.length === 0) {
    return (
      <EmptyState icon="users" title="Nenhum pedido">
        Quando alguém pedir pra organizar, o pedido aparece aqui.
      </EmptyState>
    );
  }

  const rows = [...props.rows].sort((a, b) => ORDER[a.status] - ORDER[b.status]);

  return (
    <>
      <Card flush>
        <ul className="list">
          {rows.map((row) => {
            const deciding = decide.isPending && decide.variables?.email === row.email;
            return (
              <li key={row.email} className="list-row">
                <Avatar name={row.requestedName || row.email} />
                <div className="list-row__main">
                  <div className="list-row__title">{row.requestedName || row.email}</div>
                  {row.requestedName && <div className="list-row__meta">{row.email}</div>}
                </div>
                <div className="list-row__actions">
                  {row.status === "pending" ? (
                    <>
                      <Button
                        size="sm"
                        icon="check"
                        loading={deciding && decide.variables?.decision === "approved"}
                        disabled={decide.isPending}
                        onClick={() => decide.mutate({ email: row.email, decision: "approved" })}
                      >
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        loading={deciding && decide.variables?.decision === "rejected"}
                        disabled={decide.isPending}
                        onClick={() => decide.mutate({ email: row.email, decision: "rejected" })}
                      >
                        Rejeitar
                      </Button>
                    </>
                  ) : (
                    <StatusBadge status={row.status} />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
      {decide.isError && (
        <div style={{ marginTop: 10 }}>
          <ErrorBanner message={decide.error.message} />
        </div>
      )}
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
    return <EmptyState title="Nenhuma party criada ainda">As parties dos organizadores aparecem aqui.</EmptyState>;
  }

  return (
    <>
      <Card flush>
        <ul className="list">
          {props.rows.map((row) => (
            <li key={row.id} className="list-row">
              <div className="list-row__main">
                <div className="list-row__title">{row.name}</div>
                <div className="list-row__meta">{row.ownerEmail}</div>
              </div>
              <Badge tone={STATUS_TONE[row.status] ?? "neutral"}>{STATUS_LABEL[row.status] ?? row.status}</Badge>
              {editing === row.id ? (
                <form
                  className="list-row__actions"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setMax.mutate({ partyId: row.id, maxParticipants: Number(value) });
                  }}
                >
                  <label htmlFor={`max-${row.id}`} className="sr-only">
                    Limite de participantes de {row.name}
                  </label>
                  <Input
                    id={`max-${row.id}`}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    style={{ width: 90 }}
                    autoFocus
                  />
                  <Button type="submit" size="sm" loading={setMax.isPending}>
                    Salvar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                    Cancelar
                  </Button>
                </form>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  icon="users"
                  aria-label={`Limite de ${row.maxParticipants} participantes — editar`}
                  onClick={() => {
                    setEditing(row.id);
                    setValue(String(row.maxParticipants));
                  }}
                >
                  {row.maxParticipants}
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Card>
      {setMax.isError && (
        <div style={{ marginTop: 10 }}>
          <ErrorBanner message={setMax.error.message} />
        </div>
      )}
    </>
  );
}
