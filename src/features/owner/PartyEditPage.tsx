import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import imageCompression from "browser-image-compression";
import { api } from "@/shared/api/client";
import { Badge, Button, Card, Field, Input, MoneyInput, Stack, Textarea } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { DateInputBR } from "@/shared/components/DateInputBR";
import { ImagePickerBox } from "@/shared/components/ImagePickerBox";
import { Alert, ErrorBanner } from "@/shared/components/Feedback";
import { PartyLayout, PartyLoadState } from "./PartyLayout";
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

  const [coverError, setCoverError] = useState<string | null>(null);
  const [compressingCover, setCompressingCover] = useState(false);
  const setCover = useMutation({
    mutationFn: (imageDataUrl: string | null) =>
      api.post(`/api/parties/${partyId}/set-cover`, { imageDataUrl }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["owner", "party", partyId] }),
  });

  async function handleCoverSelected(file: File | undefined) {
    setCoverError(null);
    if (!file) return;
    setCompressingCover(true);
    try {
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 640,
        maxSizeMB: 0.35,
        fileType: "image/jpeg",
      });
      const dataUrl = await imageCompression.getDataUrlFromFile(compressed);
      setCover.mutate(dataUrl);
    } catch {
      setCoverError("Não foi possível processar essa imagem. Tente outra.");
    } finally {
      setCompressingCover(false);
    }
  }

  if (!partyId) return null;
  if (isLoading || isError || !form || !data) return <PartyLoadState isLoading={isLoading || (!form && !isError)} error={error} />;

  return (
    <PartyLayout partyId={partyId} name={data.name} status={data.status}>
      <Stack gap={20}>
        <div>
          <ImagePickerBox
            imageUrl={data.imageUrl}
            onFileSelected={handleCoverSelected}
            busy={compressingCover || setCover.isPending}
          />
          {coverError && (
            <div style={{ marginTop: 8 }}>
              <ErrorBanner message={coverError} />
            </div>
          )}
          {setCover.isError && (
            <div style={{ marginTop: 8 }}>
              <ErrorBanner message={setCover.error.message} />
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate(undefined);
          }}
        >
          <Card>
            <Stack gap={20}>
              <h2 className="section-title" style={{ margin: 0 }}>Regras</h2>
              <Field label="Nome da party" htmlFor="party-name">
                <Input id="party-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </Field>
              <Field label="Descrição" htmlFor="party-description" optional>
                <Textarea
                  id="party-description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </Field>
              <div className="grid-2">
                <Field label="Valor mínimo" htmlFor="value-min">
                  <MoneyInput
                    id="value-min"
                    value={form.valueMin}
                    onChange={(e) => setForm({ ...form, valueMin: e.target.value })}
                  />
                </Field>
                <Field label="Valor máximo" htmlFor="value-max">
                  <MoneyInput
                    id="value-max"
                    value={form.valueMax}
                    onChange={(e) => setForm({ ...form, valueMax: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Itens proibidos ou não recomendados" htmlFor="forbidden" optional>
                <Textarea
                  id="forbidden"
                  value={form.forbiddenItemsText}
                  onChange={(e) => setForm({ ...form, forbiddenItemsText: e.target.value })}
                />
              </Field>
              <Field label="Prazo de confirmação (RSVP)" htmlFor="rsvp-deadline">
                <DateInputBR
                  id="rsvp-deadline"
                  value={form.rsvpDeadline}
                  onChange={(v) => setForm({ ...form, rsvpDeadline: v })}
                />
              </Field>

              {save.isError && <ErrorBanner message={save.error.message} />}
              {save.isSuccess && !save.isPending && <Alert tone="success">Alterações salvas.</Alert>}
              <div className="form-actions">
                <Button type="submit" loading={save.isPending}>
                  {save.isPending ? "Salvando…" : "Salvar alterações"}
                </Button>
              </div>
            </Stack>
          </Card>
        </form>

        <Card>
          <Stack gap={16}>
            <h2 className="section-title" style={{ margin: 0 }}>
              Categorias <span className="count">{data.categories.length}</span>
            </h2>
            <div className="row">
              {data.categories.map((c) =>
                c.isCustom ? (
                  <span key={c.id} className="tag">
                    {c.label}
                    <button
                      type="button"
                      onClick={() => removeCategory.mutate(c.id)}
                      disabled={removeCategory.isPending}
                      aria-label={`Remover categoria ${c.label}`}
                    >
                      <Icon name="x" size={14} strokeWidth={2.5} />
                    </button>
                  </span>
                ) : (
                  <Badge key={c.id}>{c.label}</Badge>
                ),
              )}
            </div>
            <p className="hint">As categorias extras que você criou podem ser removidas; as da plataforma ficam fixas.</p>
            <form
              className="row"
              style={{ flexWrap: "nowrap" }}
              onSubmit={(e) => {
                e.preventDefault();
                if (!newCategory.trim()) return;
                save.mutate([newCategory.trim()]);
                setNewCategory("");
              }}
            >
              <label htmlFor="new-category" className="sr-only">
                Nova categoria
              </label>
              <Input
                id="new-category"
                placeholder="Nova categoria"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                style={{ maxWidth: 280 }}
              />
              <Button type="submit" variant="secondary" icon="plus" disabled={!newCategory.trim()}>
                Adicionar
              </Button>
            </form>
          </Stack>
        </Card>
      </Stack>
    </PartyLayout>
  );
}
