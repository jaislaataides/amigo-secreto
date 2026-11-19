import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { Button, CheckOption, FormSection, IconButton } from "@/shared/components/ui";
import { ErrorBanner } from "@/shared/components/Feedback";
import { PartyLayout, PartyLoadState } from "./PartyLayout";
import { usePartyDetail } from "./usePartyDetail";

interface Group {
  participantIds: string[];
}

export function PartyExclusionsPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const { data, isLoading, isError, error } = usePartyDetail(partyId);
  const queryClient = useQueryClient();

  const [groups, setGroups] = useState<Group[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (data) setGroups(data.exclusions.map((e) => ({ participantIds: e.participantIds })));
  }, [data]);

  const save = useMutation({
    mutationFn: () =>
      api.put(`/api/parties/${partyId}/exclusions`, {
        exclusions: groups.map((g) => ({ type: "group", participantIds: g.participantIds })),
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["owner", "party", partyId] }),
  });

  if (!partyId) return null;
  if (isLoading || isError || !data) return <PartyLoadState isLoading={isLoading} error={error} />;

  const nameById = new Map(data.participants.map((p) => [p.id, p.name]));
  const savedSignature = JSON.stringify(data.exclusions.map((e) => e.participantIds));
  const dirty = JSON.stringify(groups.map((g) => g.participantIds)) !== savedSignature;

  return (
    <PartyLayout partyId={partyId} name={data.name} status={data.status}>
      <FormSection
        title="Grupos de exclusão"
        description="Pessoas no mesmo grupo nunca se tiram entre si. Útil pra casais e famílias."
      >
        {groups.length === 0 ? (
          <p className="muted">Nenhum grupo. Todo mundo pode tirar todo mundo.</p>
        ) : (
          <ul className="rows">
            {groups.map((g, i) => (
              <li key={i} className="row-item" style={{ minHeight: 0 }}>
                <div className="row-item__main row-item__title">
                  {g.participantIds.map((id) => nameById.get(id) ?? id).join(", ")}
                </div>
                <IconButton
                  icon="trash"
                  label={`Remover grupo ${i + 1}`}
                  variant="danger"
                  size="sm"
                  onClick={() => setGroups(groups.filter((_, j) => j !== i))}
                />
              </li>
            ))}
          </ul>
        )}
      </FormSection>

      <FormSection title="Novo grupo" description="Escolha 2 ou mais pessoas que não podem se tirar.">
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="sr-only">Pessoas do novo grupo</legend>
          <div className="options">
            {data.participants.map((p) => (
              <CheckOption
                key={p.id}
                label={p.name}
                checked={selected.includes(p.id)}
                onChange={(checked) =>
                  setSelected(checked ? [...selected, p.id] : selected.filter((id) => id !== p.id))
                }
              />
            ))}
          </div>
        </fieldset>
        <div>
          <Button
            variant="secondary"
            disabled={selected.length < 2}
            onClick={() => {
              setGroups([...groups, { participantIds: selected }]);
              setSelected([]);
            }}
          >
            {selected.length < 2 ? "Adicionar grupo" : `Adicionar grupo com ${selected.length}`}
          </Button>
        </div>
      </FormSection>

      <div className="form-footer">
        <Button loading={save.isPending} disabled={!dirty} onClick={() => save.mutate()}>
          {save.isPending ? "Salvando…" : "Salvar exclusões"}
        </Button>
        {dirty && <span className="status status--warning">Alterações não salvas</span>}
        {save.isSuccess && !dirty && <span className="status status--success">Salvo</span>}
      </div>
      {save.isError && (
        <div style={{ marginTop: 12 }}>
          <ErrorBanner message={save.error.message} />
        </div>
      )}
    </PartyLayout>
  );
}
