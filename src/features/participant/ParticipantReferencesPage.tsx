import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { Button, IconButton, Input, Stack } from "@/shared/components/ui";
import { Alert, EmptyState, ErrorBanner } from "@/shared/components/Feedback";
import { useOverlay } from "@/shared/components/Overlay";
import { LinkPreview } from "@/shared/components/LinkPreview";
import { ParticipantLayout, ParticipantLoadState } from "./ParticipantLayout";
import { useMyPartyView } from "./useMyPartyView";

const MAX_LINKS = 10;

export function ParticipantReferencesPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const { data, isLoading, isError, error } = useMyPartyView(partyId);
  const queryClient = useQueryClient();
  const { toast } = useOverlay();
  const [url, setUrl] = useState("");

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["participant", "me", partyId] });

  const addLink = useMutation({
    mutationFn: () => api.post(`/api/parties/${partyId}/me/links`, { url: url.trim() }),
    onSuccess: () => {
      toast("Link adicionado");
      setUrl("");
      invalidate();
    },
  });

  const removeLink = useMutation({
    mutationFn: (linkId: string) => api.delete(`/api/parties/${partyId}/me/links?linkId=${linkId}`),
    onSuccess: () => {
      toast("Link removido");
      invalidate();
    },
  });

  if (!partyId) return null;
  if (isLoading || isError || !data) return <ParticipantLoadState isLoading={isLoading} error={error} />;

  const links = data.me.referenceLinks;

  return (
    <ParticipantLayout partyId={partyId} name={data.party.name} imageUrl={data.party.imageUrl}>
      <Stack gap={24}>
        {links.length < MAX_LINKS ? (
          <form
            className="card"
            onSubmit={(e) => {
              e.preventDefault();
              if (url.trim()) addLink.mutate();
            }}
          >
            <Stack gap={8}>
              <label htmlFor="ref-url" className="label">
                Link de algo que você gostaria de ganhar
              </label>
              <div className="row" style={{ flexWrap: "nowrap" }}>
                <Input
                  id="ref-url"
                  inputMode="url"
                  placeholder="https://…"
                  aria-describedby="ref-url-hint"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <Button type="submit" loading={addLink.isPending} disabled={!url.trim()}>
                  {addLink.isPending ? "Buscando…" : "Adicionar"}
                </Button>
              </div>
              <p className="hint" id="ref-url-hint">
                Amazon, Shopee, AliExpress, qualquer loja. Quanto mais pistas, menor o risco de mico.
              </p>
              {addLink.isError && <ErrorBanner message={addLink.error.message} />}
            </Stack>
          </form>
        ) : (
          <Alert tone="info">Você chegou ao limite de {MAX_LINKS} links. Remova um pra adicionar outro.</Alert>
        )}

        <section>
          <h2 className="section-title">
            Suas referências <span className="count">{links.length} de {MAX_LINKS}</span>
          </h2>
          {links.length === 0 ? (
            <EmptyState>Nenhum link ainda. Referências são o melhor antídoto contra presente-mico.</EmptyState>
          ) : (
            <ul className="rows card card--flush">
              {links.map((link) => (
                <li key={link.id}>
                  <LinkPreview
                    {...link}
                    action={
                      <IconButton
                        icon="trash"
                        label={`Remover ${link.title || "link"}`}
                        variant="danger"
                        size="sm"
                        disabled={removeLink.isPending}
                        onClick={() => removeLink.mutate(link.id)}
                      />
                    }
                  />
                </li>
              ))}
            </ul>
          )}
          {removeLink.isError && (
            <div style={{ marginTop: 10 }}>
              <ErrorBanner message={removeLink.error.message} />
            </div>
          )}
        </section>
      </Stack>
    </ParticipantLayout>
  );
}
