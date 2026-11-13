import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { Button, Card, Input, Page, PageHeader } from "@/shared/components/ui";
import { EmptyState, ErrorBanner, FullPageSpinner } from "@/shared/components/Feedback";
import { ParticipantTabs } from "./ParticipantTabs";
import { useMyPartyView } from "./useMyPartyView";

const MAX_LINKS = 10;

export function ParticipantReferencesPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const { data, isLoading, isError, error } = useMyPartyView(partyId);
  const queryClient = useQueryClient();
  const [url, setUrl] = useState("");

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["participant", "me", partyId] });

  const addLink = useMutation({
    mutationFn: () => api.post(`/api/parties/${partyId}/me/links`, { url }),
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
  if (isLoading) return <FullPageSpinner />;
  if (isError) return <ErrorBanner message={error.message} />;

  const links = data!.me.referenceLinks;

  return (
    <Page>
      <PageHeader
        title={data!.party.name}
        subtitle="Cole links de produtos (ex: AliExpress, Amazon, Shopee) que você gostaria de ganhar."
      />
      <ParticipantTabs partyId={partyId} />

      {links.length === 0 && <EmptyState>Nenhum link adicionado ainda.</EmptyState>}
      {links.map((link) => (
        <Card key={link.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {link.imageUrl && (
            <img src={link.imageUrl} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8 }} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <a href={link.url} target="_blank" rel="noreferrer" style={{ fontWeight: 600, fontSize: 14 }}>
              {link.title || link.url}
            </a>
            {link.description && (
              <p style={{ color: "#71717a", fontSize: 13, margin: "4px 0 0" }}>{link.description}</p>
            )}
          </div>
          <Button variant="danger" onClick={() => removeLink.mutate(link.id)}>
            Remover
          </Button>
        </Card>
      ))}

      {links.length < MAX_LINKS ? (
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <Input placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} />
          <Button disabled={!url.trim() || addLink.isPending} onClick={() => addLink.mutate()}>
            {addLink.isPending ? "Adicionando…" : "Adicionar"}
          </Button>
        </div>
      ) : (
        <p style={{ color: "#71717a", fontSize: 13 }}>Limite de {MAX_LINKS} links atingido.</p>
      )}

      {addLink.isError && <ErrorBanner message={addLink.error.message} />}
    </Page>
  );
}
