import { useEffect, useState, type ReactNode } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { Button, ButtonLink, Field, Input, Stack } from "@/shared/components/ui";
import { Alert, EmptyState, ErrorBanner } from "@/shared/components/Feedback";
import { ParticipantLayout, ParticipantLoadState } from "./ParticipantLayout";
import { useMyPartyView, type MySizes } from "./useMyPartyView";

const EMPTY: MySizes = { top: null, bottom: null, shoe: null, sock: null };

const FIELDS: { key: keyof MySizes; label: string; placeholder: string; suggestions: string[] }[] = [
  { key: "top", label: "Camisa / blusa", placeholder: "ex: M", suggestions: ["PP", "P", "M", "G", "GG", "XGG"] },
  {
    key: "bottom",
    label: "Calça / shorts",
    placeholder: "ex: 42 ou M",
    suggestions: ["36", "38", "40", "42", "44", "46", "48", "50", "PP", "P", "M", "G", "GG", "XGG"],
  },
  {
    key: "shoe",
    label: "Sapato",
    placeholder: "ex: 38",
    suggestions: Array.from({ length: 14 }, (_, i) => String(33 + i)),
  },
  { key: "sock", label: "Meia", placeholder: "ex: 39–43", suggestions: ["34–38", "39–43", "44–46", "Tamanho único"] },
];

const same = (a: MySizes, b: MySizes) => FIELDS.every(({ key }) => (a[key] ?? "") === (b[key] ?? ""));

/** Medidas pra quem te tirou acertar roupa e calçado. Só pra quem confirmou presença. */
export function ParticipantSizesPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const { data, isLoading, isError, error } = useMyPartyView(partyId);
  const queryClient = useQueryClient();
  const [sizes, setSizes] = useState<MySizes>(EMPTY);

  useEffect(() => {
    if (data) setSizes(data.me.sizes ?? EMPTY);
  }, [data]);

  const save = useMutation({
    mutationFn: () => api.post(`/api/parties/${partyId}/me/sizes`, sizes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["participant", "me", partyId] }),
  });

  if (!partyId) return null;
  if (isLoading || isError || !data) return <ParticipantLoadState isLoading={isLoading} error={error} />;

  const layout = (children: ReactNode) => (
    <ParticipantLayout partyId={partyId} name={data.party.name} imageUrl={data.party.imageUrl} isOwner={data.me.isOwner}>
      {children}
    </ParticipantLayout>
  );

  if (data.me.rsvp !== "going") {
    return layout(
      <EmptyState
        icon="shirt"
        title="Primeiro, confirme presença"
        action={
          <ButtonLink to={`/p/${partyId}/rsvp`} variant="secondary">
            Ir pra confirmação
          </ButtonLink>
        }
      >
        As medidas só aparecem pra quem vai participar do sorteio.
      </EmptyState>,
    );
  }

  const dirty = !same(sizes, data.me.sizes ?? EMPTY);

  return layout(
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <Stack gap={20}>
        <div>
          <h2 className="section-title" style={{ marginBottom: 4 }}>
            Suas medidas
          </h2>
          <p className="hint">
            Tudo opcional. Quem te tirar vê isso junto com o seu papelzinho — menos chance de ganhar uma camisa que não
            serve.
          </p>
        </div>

        <div className="grid-2">
          {FIELDS.map((f) => (
            <Field key={f.key} label={f.label} htmlFor={`size-${f.key}`}>
              <Input
                id={`size-${f.key}`}
                list={`size-${f.key}-options`}
                placeholder={f.placeholder}
                maxLength={16}
                autoComplete="off"
                value={sizes[f.key] ?? ""}
                onChange={(e) => setSizes({ ...sizes, [f.key]: e.target.value })}
              />
              <datalist id={`size-${f.key}-options`}>
                {f.suggestions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </Field>
          ))}
        </div>

        {save.isError && <ErrorBanner message={save.error.message} />}
        {save.isSuccess && !dirty && <Alert tone="success">Medidas salvas!</Alert>}
        <div className="form-actions">
          <Button type="submit" loading={save.isPending} disabled={!dirty}>
            {save.isPending ? "Salvando…" : "Salvar medidas"}
          </Button>
          {dirty && <span className="hint">Alterações não salvas</span>}
        </div>
      </Stack>
    </form>,
  );
}
