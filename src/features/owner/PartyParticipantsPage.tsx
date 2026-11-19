import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { Avatar, Badge, Button, Card, IconButton, Input, Stack, type BadgeTone } from "@/shared/components/ui";
import { Alert, EmptyState, ErrorBanner } from "@/shared/components/Feedback";
import { PartyLayout, PartyLoadState } from "./PartyLayout";
import { usePartyDetail } from "./usePartyDetail";

interface Row {
  name: string;
  email: string;
}

const RSVP_LABEL: Record<string, string> = { pending: "aguardando", going: "confirmado", not_going: "não vai" };
const RSVP_TONE: Record<string, BadgeTone> = {
  pending: "warning",
  going: "success",
  not_going: "neutral",
};

const INVITE_LABEL: Record<string, string> = {
  pending: "convite: enviando…",
  sent: "convite: enviado",
  failed: "convite falhou",
};
const INVITE_TONE: Record<string, BadgeTone> = {
  pending: "warning",
  sent: "neutral",
  failed: "danger",
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
  if (isLoading || isError || !data) return <PartyLoadState isLoading={isLoading} error={error} />;

  const count = data.participants.length;
  const max = data.maxParticipants;
  const going = data.participants.filter((p) => p.rsvp === "going").length;
  const editable = data.status !== "drawn" && data.status !== "canceled";
  const filledRows = rows.filter((r) => r.name.trim() && r.email.trim()).length;

  function updateRow(index: number, patch: Partial<Row>) {
    setRows(rows.map((r, j) => (j === index ? { ...r, ...patch } : r)));
  }

  return (
    <PartyLayout partyId={partyId} name={data.name} status={data.status}>
      <Stack gap={20}>
        <Card>
          <div className="row row--between" style={{ marginBottom: 10 }}>
            <span className="label">
              {count} de {max} participantes
            </span>
            <span className="hint">{going} confirmados</span>
          </div>
          <div
            className="progress"
            role="progressbar"
            aria-label="Vagas preenchidas"
            aria-valuemin={0}
            aria-valuemax={max}
            aria-valuenow={count}
          >
            <span style={{ width: `${Math.min(100, (count / Math.max(max, 1)) * 100)}%` }} />
          </div>
        </Card>

        {count === 0 ? (
          <EmptyState icon="users" title="Ninguém por aqui ainda">
            Adicione nome e e-mail de cada pessoa — elas recebem o convite na hora.
          </EmptyState>
        ) : (
          <Card flush>
            <ul className="list">
              {data.participants.map((p) => (
                <li key={p.id} className="list-row">
                  <Avatar name={p.name} />
                  <div className="list-row__main">
                    <div className="list-row__title">
                      {p.name}{" "}
                      {p.isOwner && (
<Badge>organizador</Badge>
                      )}
                    </div>
                    <div className="list-row__meta">{p.email}</div>
                  </div>
                  <div className="list-row__actions">
                    {p.inviteStatus === "failed" && (
                      <Badge tone={INVITE_TONE[p.inviteStatus]} icon="alert">
                        {INVITE_LABEL[p.inviteStatus]}
                      </Badge>
                    )}
                    <Badge tone={RSVP_TONE[p.rsvp]}>{RSVP_LABEL[p.rsvp]}</Badge>
                    {editable && (
                      <IconButton
                        icon="trash"
                        label={`Remover ${p.name}`}
                        variant="danger"
                        size="sm"
                        disabled={removeParticipant.isPending}
                        onClick={() => {
                          if (window.confirm(`Remover ${p.name} da party?`)) removeParticipant.mutate(p.id);
                        }}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
        {removeParticipant.isError && <ErrorBanner message={removeParticipant.error.message} />}

        {editable && count < max && (
          <Card>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addParticipants.mutate();
              }}
            >
              <Stack gap={16}>
                <div>
                  <h2 className="section-title" style={{ margin: 0 }}>
                    Convidar pessoas
                  </h2>
                  <p className="hint">Cada pessoa recebe um convite por e-mail pra confirmar presença.</p>
                </div>
                {rows.map((row, i) => (
                  <div key={i} className="row" style={{ alignItems: "flex-start", flexWrap: "nowrap" }}>
                    <div className="grid-2" style={{ flex: 1 }}>
                      <div>
                        <label htmlFor={`row-name-${i}`} className="sr-only">
                          Nome da pessoa {i + 1}
                        </label>
                        <Input
                          id={`row-name-${i}`}
                          placeholder="Nome"
                          autoComplete="off"
                          value={row.name}
                          onChange={(e) => updateRow(i, { name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label htmlFor={`row-email-${i}`} className="sr-only">
                          E-mail da pessoa {i + 1}
                        </label>
                        <Input
                          id={`row-email-${i}`}
                          placeholder="email@exemplo.com"
                          type="email"
                          inputMode="email"
                          autoComplete="off"
                          value={row.email}
                          onChange={(e) => updateRow(i, { email: e.target.value })}
                        />
                      </div>
                    </div>
                    {rows.length > 1 && (
                      <IconButton
                        icon="x"
                        label={`Remover linha ${i + 1}`}
                        onClick={() => setRows(rows.filter((_, j) => j !== i))}
                      />
                    )}
                  </div>
                ))}
                {addParticipants.isError && <ErrorBanner message={addParticipants.error.message} />}
                <div className="form-actions">
                  <Button type="submit" icon="mail" loading={addParticipants.isPending} disabled={filledRows === 0}>
                    {addParticipants.isPending
                      ? "Enviando convites…"
                      : filledRows > 1
                        ? `Convidar ${filledRows} pessoas`
                        : "Convidar"}
                  </Button>
                  <Button variant="ghost" icon="plus" onClick={() => setRows([...rows, { name: "", email: "" }])}>
                    Mais uma pessoa
                  </Button>
                </div>
              </Stack>
            </form>
          </Card>
        )}

        {editable && count >= max && (
          <Alert tone="info">A party atingiu o limite de {max} participantes. Fale com um admin se precisar de mais vagas.</Alert>
        )}
      </Stack>
    </PartyLayout>
  );
}
