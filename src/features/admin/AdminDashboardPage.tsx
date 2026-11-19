import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { Button, FormSection, Input, Page, PageHeader, Status } from "@/shared/components/ui";
import { STATUS_LABEL, STATUS_TONE } from "@/features/owner/partyStatus";
import { ErrorBanner, InlineLoading } from "@/shared/components/Feedback";

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
      <PageHeader title="Painel do admin" />

      <FormSection
        title="Pedidos de organizador"
        description={pendingCount ? `${pendingCount} aguardando aprovação.` : "Nenhum pedido pendente."}
      >
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
      </FormSection>

      <FormSection title="Parties" description="Ajuste o limite de participantes de cada uma.">
        {parties.isLoading && <InlineLoading />}
        {parties.isError && <ErrorBanner message={parties.error.message} />}
        {parties.data && <PartiesTable rows={parties.data.parties} onChanged={() => void parties.refetch()} />}
      </FormSection>
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
    return <p className="muted">Quando alguém pedir pra organizar, o pedido aparece aqui.</p>;
  }

  const rows = [...props.rows].sort((a, b) => ORDER[a.status] - ORDER[b.status]);

  return (
    <>
      <ul className="rows">
        {rows.map((row) => {
          const deciding = decide.isPending && decide.variables?.email === row.email;
          return (
            <li key={row.email} className="row-item">
              <div className="row-item__main">
                <div className="row-item__title">{row.requestedName || row.email}</div>
                {row.requestedName && <div className="row-item__meta">{row.email}</div>}
              </div>
              <div className="row-item__aside">
                {row.status === "pending" ? (
                  <>
                    <Button
                      size="sm"
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
                  <OwnerStatus status={row.status} />
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {decide.isError && <ErrorBanner message={decide.error.message} />}
    </>
  );
}

function OwnerStatus(props: { status: string }) {
  if (props.status === "approved") return <Status tone="success">aprovado</Status>;
  if (props.status === "rejected") return <Status tone="danger">rejeitado</Status>;
  return <Status tone="warning">pendente</Status>;
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
    return <p className="muted">Nenhuma party criada ainda.</p>;
  }

  return (
    <>
      <ul className="rows">
        {props.rows.map((row) => (
          <li key={row.id} className="row-item">
            <div className="row-item__main">
              <div className="row-item__title">{row.name}</div>
              <div className="row-item__meta">{row.ownerEmail}</div>
            </div>
            <div className="row-item__aside">
              <Status tone={STATUS_TONE[row.status] ?? "neutral"}>{STATUS_LABEL[row.status] ?? row.status}</Status>
              {editing === row.id ? (
                <form
                  className="row"
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
                    style={{ width: 80 }}
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
                  aria-label={`Limite de ${row.maxParticipants} participantes. Editar`}
                  onClick={() => {
                    setEditing(row.id);
                    setValue(String(row.maxParticipants));
                  }}
                >
                  Limite {row.maxParticipants}
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {setMax.isError && <ErrorBanner message={setMax.error.message} />}
    </>
  );
}
