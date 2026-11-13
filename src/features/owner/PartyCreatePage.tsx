import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import imageCompression from "browser-image-compression";
import { ref, uploadBytes } from "firebase/storage";
import { storage } from "@/shared/firebase/client";
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
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [createdPartyId, setCreatedPartyId] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

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
      }),
    onSuccess: async (data) => {
      setCreatedPartyId(data.partyId);
      if (coverFile) {
        await uploadCover(data.partyId, coverFile);
      }
      navigate(`/owner/parties/${data.partyId}/participants`);
    },
  });

  async function uploadCover(partyId: string, file: File) {
    setUploadingCover(true);
    try {
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 1600,
        maxSizeMB: 2,
        fileType: "image/jpeg",
      });
      await uploadBytes(ref(storage, `partyImages/${partyId}/cover.jpg`), compressed, {
        contentType: "image/jpeg",
      });
      await api.post(`/api/parties/${partyId}/set-cover`, { imageVersion: Date.now() });
    } finally {
      setUploadingCover(false);
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

        <Field label="Capa (opcional)" hint="Uma imagem de até 5MB — aparece na página e nos e-mails.">
          <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} />
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

        <Button type="submit" disabled={createParty.isPending || uploadingCover}>
          {createParty.isPending || uploadingCover ? "Criando…" : "Criar party"}
        </Button>
      </form>

      {createdPartyId && <p style={{ color: "#71717a", fontSize: 13, marginTop: 12 }}>Party criada! Redirecionando…</p>}
    </Page>
  );
}
