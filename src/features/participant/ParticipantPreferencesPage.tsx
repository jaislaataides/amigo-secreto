import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { Button, Page, PageHeader } from "@/shared/components/ui";
import { ErrorBanner, FullPageSpinner } from "@/shared/components/Feedback";
import { ParticipantTabs } from "./ParticipantTabs";
import { useMyPartyView } from "./useMyPartyView";

export function ParticipantPreferencesPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const { data, isLoading, isError, error } = useMyPartyView(partyId);
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (data) setSelected(data.me.preferredCategories);
  }, [data]);

  const save = useMutation({
    mutationFn: () => api.post(`/api/parties/${partyId}/me/preferences`, { categoryIds: selected }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["participant", "me", partyId] }),
  });

  if (!partyId) return null;
  if (isLoading) return <FullPageSpinner />;
  if (isError) return <ErrorBanner message={error.message} />;

  return (
    <Page>
      <PageHeader title={data!.party.name} subtitle="Em quais categorias você gostaria de receber um presente?" />
      <ParticipantTabs partyId={partyId} />

      {data!.party.categories.map((c) => (
        <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
          <input
            type="checkbox"
            checked={selected.includes(c.id)}
            onChange={(e) =>
              setSelected(e.target.checked ? [...selected, c.id] : selected.filter((id) => id !== c.id))
            }
          />
          {c.label}
        </label>
      ))}

      {save.isError && <ErrorBanner message={save.error.message} />}
      <Button disabled={save.isPending} onClick={() => save.mutate()} style={{ marginTop: 16 }}>
        {save.isPending ? "Salvando…" : "Salvar preferências"}
      </Button>
      {save.isSuccess && <p style={{ color: "#166534", fontSize: 13, marginTop: 8 }}>Salvo!</p>}
    </Page>
  );
}
