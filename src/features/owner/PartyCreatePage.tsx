import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import imageCompression from "browser-image-compression";
import { api } from "@/shared/api/client";
import { Button, Field, Input, Page, PageHeader, Textarea } from "@/shared/components/ui";
import { ErrorBanner } from "@/shared/components/Feedback";

function defaultDeadline(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

export function PartyCreatePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [valueMin, setValueMin] = useState("30");
  const [valueMax, setValueMax] = useState("80");
  const [forbiddenItemsText, setForbiddenItemsText] = useState("");
  const [rsvpDeadline, setRsvpDeadline] = useState(defaultDeadline());
  const [customCategories, setCustomCategories] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [compressingImage, setCompressingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const createParty = useMutation({
    mutationFn: () =>
      api.post<{ partyId: string }>("/api/parties/create", {
        name,
        description,
        valueMin: Number(valueMin),
        valueMax: Number(valueMax),
        forbiddenItemsText,
        rsvpDeadline: new Date(rsvpDeadline).toISOString(),
        customCategories: customCategories
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        imageDataUrl: imageDataUrl ?? undefined,
      }),
    onSuccess: (data) => navigate(`/owner/parties/${data.partyId}/participants`),
  });

  async function handleImageSelected(file: File | undefined) {
    setImageError(null);
    if (!file) {
      setImageDataUrl(null);
      return;
    }
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
      setImageDataUrl(null);
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
        <Field label="Nome da party">
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>

        <Field label="Descrição">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>

        <Field label="Capa (opcional)" hint="A imagem é comprimida e guardada como um thumbnail pequeno.">
          <input type="file" accept="image/*" onChange={(e) => void handleImageSelected(e.target.files?.[0])} />
          {compressingImage && <p style={{ fontSize: 13, color: "#71717a" }}>Processando imagem…</p>}
          {imageError && <ErrorBanner message={imageError} />}
          {imageDataUrl && (
            <img
              src={imageDataUrl}
              alt="Pré-visualização da capa"
              style={{ marginTop: 8, maxWidth: 160, borderRadius: 8 }}
            />
          )}
        </Field>

        <div style={{ display: "flex", gap: 12 }}>
          <Field label="Valor mínimo (R$)">
            <Input type="number" min={0} value={valueMin} onChange={(e) => setValueMin(e.target.value)} required />
          </Field>
          <Field label="Valor máximo (R$)">
            <Input type="number" min={0} value={valueMax} onChange={(e) => setValueMax(e.target.value)} required />
          </Field>
        </div>

        <Field label="Itens proibidos / não recomendados">
          <Textarea
            value={forbiddenItemsText}
            onChange={(e) => setForbiddenItemsText(e.target.value)}
            placeholder="ex: nada de perfumes, nada de roupas íntimas..."
          />
        </Field>

        <Field
          label="Categorias extras (opcional)"
          hint="Separadas por vírgula. Já vêm prontas: livre, acessórios, vestimentas, objetos, decorações."
        >
          <Input
            value={customCategories}
            onChange={(e) => setCustomCategories(e.target.value)}
            placeholder="ex: livros, jogos"
          />
        </Field>

        <Field
          label="Prazo para confirmação (RSVP)"
          hint="Depois dessa data, você pode forçar o sorteio com quem já confirmou (mínimo 3)."
        >
          <Input type="date" value={rsvpDeadline} onChange={(e) => setRsvpDeadline(e.target.value)} required />
        </Field>

        {createParty.isError && <ErrorBanner message={createParty.error.message} />}

        <Button type="submit" disabled={createParty.isPending || compressingImage}>
          {createParty.isPending ? "Criando…" : "Criar party"}
        </Button>
      </form>
    </Page>
  );
}
