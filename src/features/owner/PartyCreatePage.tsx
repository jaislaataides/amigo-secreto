import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import imageCompression from "browser-image-compression";
import { api } from "@/shared/api/client";
import { usePlatformCategories } from "@/shared/hooks/usePlatformCategories";
import {
  Button,
  ButtonLink,
  CheckOption,
  Field,
  FormSection,
  Input,
  MoneyInput,
  Page,
  PageHeader,
  Textarea,
} from "@/shared/components/ui";
import { TagInput } from "@/shared/components/TagInput";
import { DateInputBR } from "@/shared/components/DateInputBR";
import { joinMicos } from "@/shared/micos";
import { ImagePickerBox } from "@/shared/components/ImagePickerBox";
import { ErrorBanner, InlineLoading } from "@/shared/components/Feedback";
import { PARTY_BACK } from "./partyStatus";

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

  // "Livre" já significa qualquer categoria — com ela marcada, trava as
  // outras como selecionadas também, sem dar pra desmarcar nenhuma.
  const isLivreSelected = baseCategoryIds.includes("livre");

  const createParty = useMutation({
    mutationFn: () =>
      api.post<{ partyId: string }>("/api/parties/create", {
        name,
        description,
        valueMin: Number(valueMin),
        valueMax: Number(valueMax),
        forbiddenItemsText: joinMicos(forbiddenTags),
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
      <PageHeader back={PARTY_BACK} title="Nova party" subtitle="Dá pra ajustar quase tudo depois." />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createParty.mutate();
        }}
      >
        <FormSection title="Sobre a party" description="Como o grupo vai reconhecer esse amigo secreto.">
          <Field label="Nome" htmlFor="party-name">
            <Input
              id="party-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Amigo secreto da firma 2026"
              autoComplete="off"
              required
            />
          </Field>
          <Field label="Descrição" htmlFor="party-description" optional>
            <Textarea
              id="party-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Data e local da troca, recados pro grupo…"
            />
          </Field>
          <div className="field">
            <span className="label">
              Capa <span className="label__optional">(opcional)</span>
            </span>
            <ImagePickerBox imageUrl={imageDataUrl} onFileSelected={handleImageSelected} busy={compressingImage} />
            {imageError && <ErrorBanner message={imageError} />}
          </div>
        </FormSection>

        <FormSection title="Presentes" description="Faixa de valor e o que vale ou não vale dar.">
          <div className="grid-2">
            <Field label="Valor mínimo" htmlFor="value-min">
              <MoneyInput id="value-min" value={valueMin} onChange={(e) => setValueMin(e.target.value)} required />
            </Field>
            <Field label="Valor máximo" htmlFor="value-max">
              <MoneyInput id="value-max" value={valueMax} onChange={(e) => setValueMax(e.target.value)} required />
            </Field>
          </div>

          <Field
            label="Lista de micos"
            htmlFor="forbidden"
            hint="Presentes que ninguém quer ganhar. Aperte Enter depois de cada item."
            optional
          >
            <TagInput
              id="forbidden"
              aria-describedby="forbidden-hint"
              value={forbiddenTags}
              onChange={setForbiddenTags}
              placeholder="perfume, meia, caneca de piada"
            />
          </Field>

          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="label" style={{ marginBottom: 6 }}>
              Categorias permitidas
            </legend>
            {platformCategories.isLoading && <InlineLoading />}
            <div className="options">
              {platformCategories.data?.map((c) => {
                const isLivre = c.id === "livre";
                const locked = isLivreSelected && !isLivre;
                return (
                  <CheckOption
                    key={c.id}
                    label={c.label}
                    checked={baseCategoryIds.includes(c.id)}
                    disabled={locked}
                    onChange={(checked) => {
                      if (isLivre) {
                        // Marcar "livre" força todas as outras como selecionadas
                        // também; desmarcar só tira o "livre" (as outras ficam
                        // como estavam, livres pra ajustar de novo).
                        setBaseCategoryIds(
                          checked
                            ? (platformCategories.data ?? []).map((cat) => cat.id)
                            : baseCategoryIds.filter((id) => id !== "livre"),
                        );
                        return;
                      }
                      setBaseCategoryIds(
                        checked ? [...baseCategoryIds, c.id] : baseCategoryIds.filter((id) => id !== c.id),
                      );
                    }}
                  />
                );
              })}
            </div>
            {isLivreSelected && (
              <p className="hint" style={{ marginTop: 6 }}>
                Com “Livre” marcado, vale qualquer categoria.
              </p>
            )}
          </fieldset>

          <Field label="Categorias extras" htmlFor="custom-categories" hint="Aperte Enter depois de cada categoria." optional>
            <TagInput
              id="custom-categories"
              aria-describedby="custom-categories-hint"
              value={customCategories}
              onChange={setCustomCategories}
              placeholder="livros, jogos"
            />
          </Field>
        </FormSection>

        <FormSection title="Prazo" description="Até quando o grupo pode confirmar presença.">
          <Field
            label="Confirmação (RSVP) até"
            htmlFor="rsvp-deadline"
            hint="Depois dessa data, você pode sortear só com quem já confirmou (mínimo 3)."
          >
            <DateInputBR id="rsvp-deadline" value={rsvpDeadline} onChange={setRsvpDeadline} />
          </Field>
        </FormSection>

        {createParty.isError && (
          <div style={{ marginBottom: 16 }}>
            <ErrorBanner message={createParty.error.message} />
          </div>
        )}

        <div className="form-footer">
          <Button type="submit" size="lg" loading={createParty.isPending} disabled={compressingImage}>
            {createParty.isPending ? "Criando…" : "Criar party"}
          </Button>
          <ButtonLink to="/owner" variant="ghost">
            Cancelar
          </ButtonLink>
        </div>
      </form>
    </Page>
  );
}
