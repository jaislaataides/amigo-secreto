import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import imageCompression from "browser-image-compression";
import { api } from "@/shared/api/client";
import { usePlatformCategories } from "@/shared/hooks/usePlatformCategories";
import { Button, Field, Input, Page, PageHeader, Textarea } from "@/shared/components/ui";
import { TagInput } from "@/shared/components/TagInput";
import { DateInputBR } from "@/shared/components/DateInputBR";
import { ImagePickerBox } from "@/shared/components/ImagePickerBox";
import { ErrorBanner, FullPageSpinner } from "@/shared/components/Feedback";

function defaultDeadline(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

export function PartyCreatePage() {
  const navigate = useNavigate();
  const platformCategories = usePlatformCategories();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [valueMin, setValueMin] = useState("30");
  const [valueMax, setValueMax] = useState("80");
  const [forbiddenTags, setForbiddenTags] = useState<string[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [baseCategoryIds, setBaseCategoryIds] = useState<string[]>([]);
  const [rsvpDeadline, setRsvpDeadline] = useState(defaultDeadline());
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [compressingImage, setCompressingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Assim que as categorias base carregam, vêm todas marcadas por padrão.
  useEffect(() => {
    if (platformCategories.data) {
      setBaseCategoryIds(platformCategories.data.map((c) => c.id));
    }
  }, [platformCategories.data]);

  const createParty = useMutation({
    mutationFn: () =>
      api.post<{ partyId: string }>("/api/parties/create", {
        name,
        description,
        valueMin: Number(valueMin),
        valueMax: Number(valueMax),
        forbiddenItemsText: forbiddenTags.join(", "),
        baseCategoryIds,
        customCategories,
        rsvpDeadline: new Date(rsvpDeadline).toISOString(),
        imageDataUrl: imageDataUrl ?? undefined,
      }),
    onSuccess: (data) => navigate(`/owner/parties/${data.partyId}/participants`),
  });

  async function handleImageSelected(file: File | undefined) {
    setImageError(null);
    if (!file) return;
    setCompressingImage(true);
    try {
      // Sem Firebase Storage (passou a exigir plano pago) — a capa vira um
      // thumbnail pequeno guardado direto no documento da party no Firestore.
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 640,
        maxSizeMB: 0.35,
        fileType: "image/jpeg",
      });
      const dataUrl = await imageCompression.getDataUrlFromFile(compressed);
      setImageDataUrl(dataUrl);
    } catch {
      setImageError("Não foi possível processar essa imagem. Tente outra.");
    } finally {
      setCompressingImage(false);
    }
  }

  return (
    <Page>
      <PageHeader title="Criar party" subtitle="Defina as regras do seu amigo secreto." />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createParty.mutate();
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <ImagePickerBox imageUrl={imageDataUrl} onFileSelected={handleImageSelected} />
          {compressingImage && <p style={{ fontSize: 13, color: "#71717a", marginTop: 8 }}>Processando imagem…</p>}
          {imageError && <ErrorBanner message={imageError} />}
        </div>

        <Field label="Nome da party">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>

        <Field label="Descrição">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>

        <div style={{ display: "flex", gap: 12 }}>
          <Field label="Valor mínimo (R$)">
            <Input type="number" min={0} value={valueMin} onChange={(e) => setValueMin(e.target.value)} required />
          </Field>
          <Field label="Valor máximo (R$)">
            <Input type="number" min={0} value={valueMax} onChange={(e) => setValueMax(e.target.value)} required />
          </Field>
        </div>

        <Field label="Itens proibidos / não recomendados" hint="Digite e aperte Enter pra cada item.">
          <TagInput value={forbiddenTags} onChange={setForbiddenTags} placeholder="ex: perfumes, roupas íntimas" />
        </Field>

        <Field label="Categorias">
          {platformCategories.isLoading && <FullPageSpinner />}
          {platformCategories.data?.map((c) => (
            <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
              <input
                type="checkbox"
                checked={baseCategoryIds.includes(c.id)}
                onChange={(e) =>
                  setBaseCategoryIds(
                    e.target.checked ? [...baseCategoryIds, c.id] : baseCategoryIds.filter((id) => id !== c.id),
                  )
                }
              />
              {c.label}
            </label>
          ))}
        </Field>

        <Field label="Categorias extras (opcional)" hint="Digite e aperte Enter pra cada categoria.">
          <TagInput value={customCategories} onChange={setCustomCategories} placeholder="ex: livros, jogos" />
        </Field>

        <Field
          label="Prazo para confirmação (RSVP)"
          hint="Depois dessa data, você pode forçar o sorteio com quem já confirmou (mínimo 3)."
        >
          <DateInputBR value={rsvpDeadline} onChange={setRsvpDeadline} />
        </Field>

        {createParty.isError && <ErrorBanner message={createParty.error.message} />}

        <Button type="submit" disabled={createParty.isPending || compressingImage}>
          {createParty.isPending ? "Criando…" : "Criar party"}
        </Button>
      </form>
    </Page>
  );
}
