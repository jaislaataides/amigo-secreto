import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { Button, CheckOption, Stack } from "@/shared/components/ui";
import { Alert, ErrorBanner } from "@/shared/components/Feedback";
import { ParticipantLayout, ParticipantLoadState } from "./ParticipantLayout";
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
  if (isLoading || isError || !data) return <ParticipantLoadState isLoading={isLoading} error={error} />;

  const dirty = [...selected].sort().join("|") !== [...data.me.preferredCategories].sort().join("|");

  return (
    <ParticipantLayout partyId={partyId} view={data}>
      <Stack gap={20}>
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="section-title" style={{ padding: 0 }}>
            Que tipo de presente você curte?
          </legend>
          <p className="hint" style={{ marginBottom: 12 }}>
            Marque quantas quiser — quem te tirar usa isso pra não pagar mico.
          </p>
          <div className="options">
            {data.party.categories.map((c) => (
              <CheckOption
                key={c.id}
                label={c.label}
                checked={selected.includes(c.id)}
                onChange={(checked) =>
                  setSelected(checked ? [...selected, c.id] : selected.filter((id) => id !== c.id))
                }
              />
            ))}
          </div>
        </fieldset>

        {save.isError && <ErrorBanner message={save.error.message} />}
        {save.isSuccess && !dirty && <Alert tone="success">Preferências salvas!</Alert>}
        <div className="form-actions">
          <Button loading={save.isPending} disabled={!dirty} onClick={() => save.mutate()}>
            {save.isPending ? "Salvando…" : "Salvar preferências"}
          </Button>
          {dirty && <span className="hint">Alterações não salvas</span>}
        </div>
      </Stack>
    </ParticipantLayout>
  );
}
