import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { Button, CheckOption, FormSection, Stack } from "@/shared/components/ui";
import { ErrorBanner } from "@/shared/components/Feedback";
import { useOverlay } from "@/shared/components/Overlay";
import { ParticipantLayout, ParticipantLoadState } from "./ParticipantLayout";
import { useMyPartyView } from "./useMyPartyView";

export function ParticipantPreferencesPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const { data, isLoading, isError, error } = useMyPartyView(partyId);
  const queryClient = useQueryClient();
  const { toast } = useOverlay();
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (data) setSelected(data.me.preferredCategories);
  }, [data]);

  const save = useMutation({
    mutationFn: () => api.post(`/api/parties/${partyId}/me/preferences`, { categoryIds: selected }),
    onSuccess: () => {
      toast("Preferências salvas");
      void queryClient.invalidateQueries({ queryKey: ["participant", "me", partyId] });
    },
  });

  if (!partyId) return null;
  if (isLoading || isError || !data) return <ParticipantLoadState isLoading={isLoading} error={error} />;

  const dirty = [...selected].sort().join("|") !== [...data.me.preferredCategories].sort().join("|");

  return (
    <ParticipantLayout partyId={partyId} name={data.party.name} imageUrl={data.party.imageUrl}>
      <Stack gap={16}>
        <FormSection
          title="Que tipo de presente você curte?"
          description="Marque quantas quiser. Quem te tirar usa isso pra não pagar mico."
        >
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="sr-only">Categorias</legend>
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
        </FormSection>

        {save.isError && <ErrorBanner message={save.error.message} />}
        <div className="form-footer">
          <Button loading={save.isPending} disabled={!dirty} onClick={() => save.mutate()}>
            {save.isPending ? "Salvando…" : "Salvar preferências"}
          </Button>
          {dirty && <span className="status status--warning">Alterações não salvas</span>}
        </div>
      </Stack>
    </ParticipantLayout>
  );
}
