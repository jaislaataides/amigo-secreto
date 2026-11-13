import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { Button, Field, Input, Page, PageHeader, Textarea } from "@/shared/components/ui";
import { ErrorBanner, FullPageSpinner } from "@/shared/components/Feedback";
import { PartyTabs } from "./PartyTabs";
import { usePartyDetail } from "./usePartyDetail";

function toDateInputValue(deadline: PartyDetailDeadline): string {
  if (typeof deadline === "string") return deadline.slice(0, 10);
  return new Date(deadline._seconds * 1000).toISOString().slice(0, 10);
}

type PartyDetailDeadline = { _seconds: number; _nanoseconds: number } | string;

export function PartyEditPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const { data, isLoading, isError, error } = usePartyDetail(partyId);
  const queryClient = useQueryClient();

  const [form, setForm] = useState<{
    name: string;
    description: string;
    valueMin: string;
    valueMax: string;
    forbiddenItemsText: string;
    rsvpDeadline: string;
  } | null>(null);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    if (!data) return;
    setForm({
      name: data.name,
      description: data.description,
      valueMin: String(data.valueRange.min),
      valueMax: String(data.valueRange.max),
      forbiddenItemsText: data.forbiddenItemsText,
      rsvpDeadline: toDateInputValue(data.rsvpDeadline),
    });
  }, [data]);

  const save = useMutation({
    mutationFn: (addCustomCategories?: string[]) =>
      api.post(`/api/parties/${partyId}/update-rules`, {
        name: form?.name,
        description: form?.description,
        valueMin: Number(form?.valueMin),
        valueMax: Number(form?.valueMax),
        forbiddenItemsText: form?.forbiddenItemsText,
        rsvpDeadline: form?.rsvpDeadline ? new Date(form.rsvpDeadline).toISOString() : undefined,
        addCustomCategories,
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["owner", "party", partyId] }),
  });

  const removeCategory = useMutation({
    mutationFn: (categoryId: string) =>
      api.post(`/api/parties/${partyId}/update-rules`, { removeCategoryIds: [categoryId] }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["owner", "party", partyId] }),
  });

  if (!partyId) return null;
  if (isLoading || !form) return <FullPageSpinner />;
  if (isError) return <ErrorBanner message={error.message} />;

  return (
    <Page>
      <PageHeader title={data!.name} />
      <PartyTabs partyId={partyId} />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(undefined);
        }}
      >
        <Field label="Nome da party">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Descrição">
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <div style={{ display: "flex", gap: 12 }}>
          <Field label="Valor mínimo (R$)">
            <Input type="number" value={form.valueMin} onChange={(e) => setForm({ ...form, valueMin: e.target.value })} />
          </Field>
          <Field label="Valor máximo (R$)">
            <Input type="number" value={form.valueMax} onChange={(e) => setForm({ ...form, valueMax: e.target.value })} />
          </Field>
        </div>
        <Field label="Itens proibidos / não recomendados">
          <Textarea
            value={form.forbiddenItemsText}
            onChange={(e) => setForm({ ...form, forbiddenItemsText: e.target.value })}
          />
        </Field>
        <Field label="Prazo de confirmação (RSVP)">
          <Input type="date" value={form.rsvpDeadline} onChange={(e) => setForm({ ...form, rsvpDeadline: e.target.value })} />
        </Field>

        {save.isError && <ErrorBanner message={save.error.message} />}
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Salvando…" : "Salvar alterações"}
        </Button>
      </form>

      <h2 style={{ fontSize: 16, marginTop: 32 }}>Categorias</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {data!.categories.map((c) => (
          <li key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
            <span>
              {c.label} {c.isCustom && <em style={{ color: "#71717a", fontSize: 12 }}>(customizada)</em>}
            </span>
            {c.isCustom && (
              <button
                onClick={() => removeCategory.mutate(c.id)}
                style={{ background: "none", border: "none", color: "#991b1b", cursor: "pointer", fontSize: 13 }}
              >
                remover
              </button>
            )}
          </li>
        ))}
      </ul>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <Input
          placeholder="Nova categoria"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          style={{ maxWidth: 220 }}
        />
        <Button
          variant="secondary"
          disabled={!newCategory.trim()}
          onClick={() => {
            save.mutate([newCategory]);
            setNewCategory("");
          }}
        >
          Adicionar
        </Button>
      </div>
    </Page>
  );
}
