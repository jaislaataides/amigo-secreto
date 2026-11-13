import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { Button, Card, Page, PageHeader } from "@/shared/components/ui";
import { EmptyState, ErrorBanner, FullPageSpinner } from "@/shared/components/Feedback";
import { PartyTabs } from "./PartyTabs";
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
  if (isLoading) return <FullPageSpinner />;
  if (isError) return <ErrorBanner message={error.message} />;

  const nameById = new Map(data!.participants.map((p) => [p.id, p.name]));

  return (
    <Page>
      <PageHeader
        title={data!.name}
        subtitle="Pessoas num mesmo grupo nunca se tiram entre si — útil pra evitar casais/famílias se tirando."
      />
      <PartyTabs partyId={partyId} />

      <h2 style={{ fontSize: 16 }}>Grupos de exclusão</h2>
      {groups.length === 0 && <EmptyState>Nenhuma exclusão definida.</EmptyState>}
      {groups.map((g, i) => (
        <Card key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{g.participantIds.map((id) => nameById.get(id) ?? id).join(" · ")}</span>
          <Button variant="danger" onClick={() => setGroups(groups.filter((_, j) => j !== i))}>
            Remover
          </Button>
        </Card>
      ))}

      <h2 style={{ fontSize: 16, marginTop: 24 }}>Criar novo grupo</h2>
      <Card>
        {data!.participants.map((p) => (
          <label key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
            <input
              type="checkbox"
              checked={selected.includes(p.id)}
              onChange={(e) =>
                setSelected(e.target.checked ? [...selected, p.id] : selected.filter((id) => id !== p.id))
              }
            />
            {p.name}
          </label>
        ))}
        <Button
          variant="secondary"
          disabled={selected.length < 2}
          style={{ marginTop: 12 }}
          onClick={() => {
            setGroups([...groups, { participantIds: selected }]);
            setSelected([]);
          }}
        >
          + Adicionar grupo ({selected.length} selecionados)
        </Button>
      </Card>

      {save.isError && <ErrorBanner message={save.error.message} />}
      <Button disabled={save.isPending} onClick={() => save.mutate()}>
        {save.isPending ? "Salvando…" : "Salvar exclusões"}
      </Button>
    </Page>
  );
}
