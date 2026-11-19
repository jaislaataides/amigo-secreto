import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { Badge, Button, Card, CheckOption, IconButton, Stack } from "@/shared/components/ui";
import { Alert, EmptyState, ErrorBanner } from "@/shared/components/Feedback";
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
    <PartyLayout
      partyId={partyId}
      name={data.name}
      status={data.status}
      subtitle="Pessoas no mesmo grupo nunca se tiram entre si — ótimo pra casais e famílias."
    >
      <Stack gap={20}>
        <section>
          <h2 className="section-title">
            Grupos de exclusão <span className="count">{groups.length}</span>
          </h2>
          {groups.length === 0 ? (
            <EmptyState icon="ban" title="Nenhuma exclusão">
              Todo mundo pode tirar todo mundo. Crie um grupo abaixo se precisar evitar algum par.
            </EmptyState>
          ) : (
            <Card flush>
              <ul className="list">
                {groups.map((g, i) => (
                  <li key={i} className="list-row">
                    <div className="list-row__main row" style={{ gap: 6 }}>
                      {g.participantIds.map((id) => (
                        <Badge key={id} tone="brand">
                          {nameById.get(id) ?? id}
                        </Badge>
                      ))}
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
            </Card>
          )}
        </section>

        <Card>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="section-title" style={{ padding: 0 }}>
              Novo grupo
            </legend>
            <p className="hint" style={{ marginBottom: 12 }}>
              Escolha 2 ou mais pessoas que não podem se tirar.
            </p>
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
          <div className="form-actions" style={{ marginTop: 16 }}>
            <Button
              variant="secondary"
              icon="plus"
              disabled={selected.length < 2}
              onClick={() => {
                setGroups([...groups, { participantIds: selected }]);
                setSelected([]);
              }}
            >
              {selected.length < 2 ? "Adicionar grupo" : `Adicionar grupo com ${selected.length}`}
            </Button>
          </div>
        </Card>

        {save.isError && <ErrorBanner message={save.error.message} />}
        {save.isSuccess && !dirty && <Alert tone="success">Exclusões salvas.</Alert>}
        <div className="form-actions">
          <Button loading={save.isPending} disabled={!dirty} onClick={() => save.mutate()}>
            {save.isPending ? "Salvando…" : "Salvar exclusões"}
          </Button>
          {dirty && <span className="hint">Você tem alterações não salvas.</span>}
        </div>
      </Stack>
    </PartyLayout>
  );
}
