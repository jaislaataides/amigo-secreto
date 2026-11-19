import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import imageCompression from "browser-image-compression";
import { api } from "@/shared/api/client";
import { Badge, Button, Field, FormSection, Input, MoneyInput, Textarea } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { DateInputBR } from "@/shared/components/DateInputBR";
import { joinMicos, parseMicos } from "@/shared/micos";
import { ImagePickerBox } from "@/shared/components/ImagePickerBox";
import { ErrorBanner } from "@/shared/components/Feedback";
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
    rsvpDeadline: string;
  } | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [newMico, setNewMico] = useState("");

  useEffect(() => {
    if (!data) return;
    setForm({
      name: data.name,
      description: data.description,
      valueMin: String(data.valueRange.min),
      valueMax: String(data.valueRange.max),
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
        rsvpDeadline: form?.rsvpDeadline ? new Date(form.rsvpDeadline).toISOString() : undefined,
        addCustomCategories,
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["owner", "party", partyId] }),
  });

  // A lista de micos salva na hora, item por item, igual às categorias.
  const saveMicos = useMutation({
    mutationFn: (items: string[]) =>
      api.post(`/api/parties/${partyId}/update-rules`, { forbiddenItemsText: joinMicos(items) }),
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

  const micos = parseMicos(data.forbiddenItemsText);

  return (
    <PartyLayout partyId={partyId} name={data.name} status={data.status}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(undefined);
        }}
      >
        <FormSection title="Sobre a party">
          <Field label="Nome" htmlFor="party-name">
            <Input id="party-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </Field>
          <Field label="Descrição" htmlFor="party-description" optional>
            <Textarea
              id="party-description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
        </FormSection>

        <FormSection title="Presentes">
          <div className="grid-2">
            <Field label="Valor mínimo" htmlFor="value-min">
              <MoneyInput id="value-min" value={form.valueMin} onChange={(e) => setForm({ ...form, valueMin: e.target.value })} />
            </Field>
            <Field label="Valor máximo" htmlFor="value-max">
              <MoneyInput id="value-max" value={form.valueMax} onChange={(e) => setForm({ ...form, valueMax: e.target.value })} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Prazo">
          <Field label="Confirmação (RSVP) até" htmlFor="rsvp-deadline">
            <DateInputBR id="rsvp-deadline" value={form.rsvpDeadline} onChange={(v) => setForm({ ...form, rsvpDeadline: v })} />
          </Field>
        </FormSection>

        <div className="form-footer" style={{ marginBottom: 8 }}>
          <Button type="submit" loading={save.isPending}>
            {save.isPending ? "Salvando…" : "Salvar alterações"}
          </Button>
          {save.isSuccess && !save.isPending && <span className="status status--success">Salvo</span>}
        </div>
        {save.isError && <ErrorBanner message={save.error.message} />}
      </form>

      <FormSection title="Capa" description="Aparece no topo da página de cada participante.">
        <ImagePickerBox
          imageUrl={data.imageUrl}
          onFileSelected={handleCoverSelected}
          busy={compressingCover || setCover.isPending}
        />
        {coverError && <ErrorBanner message={coverError} />}
        {setCover.isError && <ErrorBanner message={setCover.error.message} />}
      </FormSection>

      <FormSection
        title="Categorias"
        description="As da plataforma ficam fixas. As extras que você criou podem ser removidas."
      >
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
          <Button type="submit" variant="secondary" disabled={!newCategory.trim()}>
            Adicionar
          </Button>
        </form>
      </FormSection>

      <FormSection title="Lista de micos" description="Presentes que ninguém quer ganhar. Todo mundo da party vê essa lista.">
        {micos.length > 0 && (
          <div className="row">
            {micos.map((item) => (
              <span key={item} className="tag">
                {item}
                <button
                  type="button"
                  onClick={() => saveMicos.mutate(micos.filter((m) => m !== item))}
                  disabled={saveMicos.isPending}
                  aria-label={`Remover mico ${item}`}
                >
                  <Icon name="x" size={14} strokeWidth={2.5} />
                </button>
              </span>
            ))}
          </div>
        )}
        <form
          className="row"
          style={{ flexWrap: "nowrap" }}
          onSubmit={(e) => {
            e.preventDefault();
            const added = parseMicos(newMico);
            if (added.length === 0) return;
            saveMicos.mutate(parseMicos(joinMicos([...micos, ...added])));
            setNewMico("");
          }}
        >
          <label htmlFor="new-mico" className="sr-only">
            Novo mico
          </label>
          <Input
            id="new-mico"
            placeholder="Novo mico"
            value={newMico}
            onChange={(e) => setNewMico(e.target.value)}
            style={{ maxWidth: 280 }}
          />
          <Button type="submit" variant="secondary" loading={saveMicos.isPending} disabled={!newMico.trim()}>
            Adicionar
          </Button>
        </form>
        {saveMicos.isError && <ErrorBanner message={saveMicos.error.message} />}
      </FormSection>
    </PartyLayout>
  );
}
