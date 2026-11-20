import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { Button, ButtonLink, Field, Input } from "@/shared/components/ui";
import { Alert, EmptyState, ErrorBanner } from "@/shared/components/Feedback";
import { type MySizes } from "./useMyPartyView";
import type { SaveHandle } from "./SaveHandle";

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

/**
 * Medidas pra quem te tirou acertar roupa e calçado — usado pela página de
 * participante e pela do organizador (ver PartyCreatorGiftPage). Expõe
 * `saveIfDirty` via ref pra o botão "Próximo" (ParticipantStepNav) salvar
 * antes de navegar.
 */
export const SizesForm = forwardRef<SaveHandle, { partyId: string; rsvp: string; sizes: MySizes | null }>(
  function SizesForm(props, ref) {
    const queryClient = useQueryClient();
    const [sizes, setSizes] = useState<MySizes>(props.sizes ?? EMPTY);

    useEffect(() => {
      setSizes(props.sizes ?? EMPTY);
    }, [props.sizes]);

    const save = useMutation({
      mutationFn: () => api.post(`/api/parties/${props.partyId}/me/sizes`, sizes),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["participant", "me", props.partyId] }),
    });

    const dirty = !same(sizes, props.sizes ?? EMPTY);

    useImperativeHandle(ref, () => ({
      saveIfDirty: async () => {
        if (dirty) await save.mutateAsync();
      },
    }));

    if (props.rsvp !== "going") {
      return (
        <EmptyState
          icon="shirt"
          title="Primeiro, confirme presença"
          action={
            <ButtonLink to={`/p/${props.partyId}/rsvp`} variant="secondary">
              Ir pra confirmação
            </ButtonLink>
          }
        >
          As medidas só aparecem pra quem vai participar do sorteio.
        </EmptyState>
      );
    }

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <h2 className="section-title" style={{ marginBottom: 4 }}>
            Suas medidas
          </h2>
          <p className="hint">
            Tudo opcional. Quem te tirar vê isso junto com o seu papelzinho — menos chance de ganhar uma camisa que
            não serve.
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
        <div className="form-actions" style={{ marginTop: 16 }}>
          <Button type="submit" loading={save.isPending} disabled={!dirty}>
            {save.isPending ? "Salvando…" : "Salvar medidas"}
          </Button>
          {dirty && <span className="hint">Alterações não salvas</span>}
        </div>
      </form>
    );
  },
);
