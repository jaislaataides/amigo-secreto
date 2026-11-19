import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { Button, Card, IconButton, Input, Stack } from "@/shared/components/ui";
import { Alert, EmptyState, ErrorBanner } from "@/shared/components/Feedback";
import { LinkPreview } from "@/shared/components/LinkPreview";
import { ParticipantLayout, ParticipantLoadState } from "./ParticipantLayout";
import { useMyPartyView } from "./useMyPartyView";

const MAX_LINKS = 10;

export function ParticipantReferencesPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const { data, isLoading, isError, error } = useMyPartyView(partyId);
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["participant", "me", partyId] });

  const addLink = useMutation({
    mutationFn: () => api.post(`/api/parties/${partyId}/me/links`, { url: url.trim() }),
    onSuccess: () => {
      setUrl("");
      invalidate();
    },
  });

  const removeLink = useMutation({
    mutationFn: (linkId: string) => api.delete(`/api/parties/${partyId}/me/links?linkId=${linkId}`),
    onSuccess: invalidate,
  });

  if (!partyId) return null;
  if (isLoading || isError || !data) return <ParticipantLoadState isLoading={isLoading} error={error} />;

  const links = data.me.referenceLinks;

  return (
    <ParticipantLayout partyId={partyId} view={data}>
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
                  Cole o link de algo que você gostaria de ganhar (Amazon, Shopee, AliExpress…).
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
              Quanto mais pistas, menor o risco de ganhar um mico.
            </EmptyState>
          ) : (
            <Stack gap={10}>
              {links.map((link) => (
                <LinkPreview
                  key={link.id}
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
              ))}
            </Stack>
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
