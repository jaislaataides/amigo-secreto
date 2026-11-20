import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { Button, Card, IconButton, Input, Stack } from "@/shared/components/ui";
import { Alert, EmptyState, ErrorBanner } from "@/shared/components/Feedback";
import { LinkPreview } from "@/shared/components/LinkPreview";
import type { MyReferenceLink } from "./useMyPartyView";

const MAX_LINKS = 10;

/** Links de referência de presente — usado pela página de participante e pela do organizador (ver PartyCreatorGiftPage). */
export function ReferenceLinksForm(props: { partyId: string; links: MyReferenceLink[] }) {
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["participant", "me", props.partyId] });

  const addLink = useMutation({
    mutationFn: () => api.post(`/api/parties/${props.partyId}/me/links`, { url: url.trim() }),
    onSuccess: () => {
      setUrl("");
      invalidate();
    },
  });

  const removeLink = useMutation({
    mutationFn: (linkId: string) => api.delete(`/api/parties/${props.partyId}/me/links?linkId=${linkId}`),
    // Só termina quando a lista nova chega (o link some sem "voltar" antes).
    onSuccess: () => invalidate(),
  });

  const links = props.links;

  return (
    <Stack gap={20}>
      {links.length < MAX_LINKS ? (
        <Card>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (url.trim()) addLink.mutate();
            }}
          >
            <Stack gap={10}>
              <label htmlFor="ref-url" className="section-title" style={{ margin: 0 }}>
                Adicionar referência
              </label>
              <p className="hint" id="ref-url-hint">
                Cole o link de algo que você gostaria de ganhar (Amazon, Shopee, AliExpress…). Quanto mais pistas,
                menor o risco de mico.
              </p>
              <div className="row" style={{ flexWrap: "nowrap" }}>
                <Input
                  id="ref-url"
                  inputMode="url"
                  placeholder="https://…"
                  aria-describedby="ref-url-hint"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <Button type="submit" icon="plus" loading={addLink.isPending} disabled={!url.trim()}>
                  {addLink.isPending ? "Buscando…" : "Adicionar"}
                </Button>
              </div>
              {addLink.isError && <ErrorBanner message={addLink.error.message} />}
            </Stack>
          </form>
        </Card>
      ) : (
        <Alert tone="info">Você chegou ao limite de {MAX_LINKS} links. Remova um pra adicionar outro.</Alert>
      )}

      <section>
        <h2 className="section-title">
          Suas referências <span className="count">{links.length}/{MAX_LINKS}</span>
        </h2>
        {links.length === 0 ? (
          <EmptyState icon="link" title="Nenhum link ainda">
            Referências são o melhor antídoto contra presente-mico.
          </EmptyState>
        ) : (
          <Stack gap={10}>
            {links.map((link) => {
              const removing = removeLink.isPending && removeLink.variables === link.id;
              return (
                <div key={link.id} className={removing ? "is-removing" : undefined}>
                  <LinkPreview
                    {...link}
                    action={
                      <IconButton
                        icon="trash"
                        label={removing ? "Removendo link…" : `Remover ${link.title || "link"}`}
                        variant="danger"
                        size="sm"
                        loading={removing}
                        disabled={removeLink.isPending}
                        onClick={() => removeLink.mutate(link.id)}
                      />
                    }
                  />
                </div>
              );
            })}
          </Stack>
        )}
        {removeLink.isError && (
          <div style={{ marginTop: 10 }}>
            <ErrorBanner message={removeLink.error.message} />
          </div>
        )}
      </section>
    </Stack>
  );
}
