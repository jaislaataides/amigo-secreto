import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { Button, FormSection, IconButton, Input, Status, type BadgeTone } from "@/shared/components/ui";
import { Alert, EmptyState, ErrorBanner } from "@/shared/components/Feedback";
import { useOverlay } from "@/shared/components/Overlay";
import { Icon } from "@/shared/components/Icon";
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Erro de uma linha do convite, ou null se ela está ok (ou vazia). */
function rowError(row: Row): string | null {
  const name = row.name.trim();
  const email = row.email.trim();
  if (!name && !email) return null;
  if (!name) return "Falta o nome.";
  if (!email) return "Falta o e-mail.";
  if (!EMAIL_RE.test(email)) return "Esse e-mail não parece válido.";
  return null;
}

export function PartyParticipantsPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const { data, isLoading, isError, error } = usePartyDetail(partyId);
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<Row[]>([{ name: "", email: "" }]);
  // Erros só aparecem depois que a pessoa sai do campo ou tenta enviar.
  const [touched, setTouched] = useState<Set<number>>(new Set());
  const [attempted, setAttempted] = useState(false);
  const { toast, confirm } = useOverlay();

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["owner", "party", partyId] });

  const addParticipants = useMutation({
    mutationFn: () =>
      api.post(`/api/parties/${partyId}/participants`, {
        participants: rows.filter((r) => r.name.trim() && r.email.trim()),
      }),
    onSuccess: () => {
      const sent = rows.filter((r) => r.name.trim() && r.email.trim()).length;
      toast(sent === 1 ? "Convite enviado" : `${sent} convites enviados`);
      setRows([{ name: "", email: "" }]);
      setTouched(new Set());
      setAttempted(false);
      invalidate();
    },
  });

  const removeParticipant = useMutation({
    mutationFn: (p: { id: string; name: string }) => api.delete(`/api/parties/${partyId}/participants/${p.id}`),
    onSuccess: (_data, p) => {
      toast(`${p.name} removido(a)`);
      invalidate();
    },
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

  const errors = rows.map(rowError);
  const visibleError = (i: number) => (attempted || touched.has(i) ? errors[i] : null);

  return (
    <PartyLayout
      partyId={partyId}
      name={data.name}
      status={data.status}
      meta={
        <span>
          {count} de {max} participantes · {going} confirmados
        </span>
      }
    >
      {count === 0 ? (
        <EmptyState title="Ninguém por aqui ainda">
          Adicione nome e e-mail de cada pessoa. Elas recebem o convite na hora.
        </EmptyState>
      ) : (
        <ul className="rows card card--flush">
          {data.participants.map((p) => (
            <li key={p.id} className="row-item">
              <div className="row-item__main">
                <div className="row-item__title">
                  {p.name}
                  {p.isOwner && <span className="muted" style={{ fontWeight: 400 }}> · organizador</span>}
                </div>
                <div className="row-item__meta">{p.email}</div>
              </div>
              <div className="row-item__aside">
                {p.inviteStatus === "failed" && (
                  <Status tone={INVITE_TONE[p.inviteStatus]}>{INVITE_LABEL[p.inviteStatus]}</Status>
                )}
                <Status tone={RSVP_TONE[p.rsvp]}>{RSVP_LABEL[p.rsvp]}</Status>
                {editable && (
                  <IconButton
                    icon="trash"
                    label={`Remover ${p.name}`}
                    variant="danger"
                    size="sm"
                    disabled={removeParticipant.isPending}
                    onClick={async () => {
                      const ok = await confirm({
                        title: `Remover ${p.name}?`,
                        body: "A pessoa sai da party e não participa do sorteio. Dá pra convidar de novo depois.",
                        confirmLabel: "Remover",
                        danger: true,
                      });
                      if (ok) removeParticipant.mutate({ id: p.id, name: p.name });
                    }}
                  />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {removeParticipant.isError && (
        <div style={{ marginTop: 12 }}>
          <ErrorBanner message={removeParticipant.error.message} />
        </div>
      )}

      {editable && count < max && (
        <form
          style={{ marginTop: 24 }}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            const firstBad = errors.findIndex(Boolean);
            if (firstBad >= 0) {
              setAttempted(true);
              document.getElementById(`row-name-${firstBad}`)?.focus();
              return;
            }
            addParticipants.mutate();
          }}
        >
          <FormSection title="Convidar" description="Cada pessoa recebe um e-mail pra confirmar presença.">
            {rows.map((row, i) => (
              <div key={i}>
              <div className="row" style={{ alignItems: "flex-start", flexWrap: "nowrap" }}>
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
                      aria-invalid={Boolean(visibleError(i)) && !row.name.trim() ? true : undefined}
                      aria-describedby={visibleError(i) ? `row-error-${i}` : undefined}
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
                      aria-invalid={Boolean(visibleError(i)) && Boolean(row.name.trim()) ? true : undefined}
                      aria-describedby={visibleError(i) ? `row-error-${i}` : undefined}
                      onChange={(e) => updateRow(i, { email: e.target.value })}
                      onBlur={() => setTouched(new Set(touched).add(i))}
                    />
                  </div>
                </div>
                {rows.length > 1 && (
                  <IconButton icon="x" label={`Remover linha ${i + 1}`} onClick={() => setRows(rows.filter((_, j) => j !== i))} />
                )}
              </div>
              {visibleError(i) && (
                <p className="field__error" id={`row-error-${i}`} style={{ marginTop: 6 }}>
                  <Icon name="alert" size={16} />
                  {visibleError(i)}
                </p>
              )}
              </div>
            ))}
            {addParticipants.isError && <ErrorBanner message={addParticipants.error.message} />}
            <div className="form-actions" style={{ marginTop: 0 }}>
              <Button type="submit" loading={addParticipants.isPending} disabled={filledRows === 0}>
                {addParticipants.isPending
                  ? "Enviando convites…"
                  : filledRows > 1
                    ? `Convidar ${filledRows} pessoas`
                    : "Convidar"}
              </Button>
              <Button variant="ghost" onClick={() => setRows([...rows, { name: "", email: "" }])}>
                Mais uma pessoa
              </Button>
            </div>
          </FormSection>
        </form>
      )}

      {editable && count >= max && (
        <div style={{ marginTop: 24 }}>
          <Alert tone="info">A party atingiu o limite de {max} participantes. Fale com um admin se precisar de mais vagas.</Alert>
        </div>
      )}
    </PartyLayout>
  );
}
