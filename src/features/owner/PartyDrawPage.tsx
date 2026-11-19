import { useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiClientError } from "@/shared/api/client";
import { Button, Card, Stack } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { Alert, ErrorBanner } from "@/shared/components/Feedback";
import { PartyLayout, PartyLoadState } from "./PartyLayout";
import { usePartyDetail } from "./usePartyDetail";

export function PartyDrawPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const { data, isLoading, isError, error } = usePartyDetail(partyId);
  const queryClient = useQueryClient();

  const draw = useMutation({
    mutationFn: () => api.post<{ assignedCount: number }>(`/api/parties/${partyId}/draw`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["owner", "party", partyId] }),
  });

  if (!partyId) return null;
  if (isLoading || isError || !data) return <PartyLoadState isLoading={isLoading} error={error} />;

  const going = data.participants.filter((p) => p.rsvp === "going").length;
  const pending = data.participants.filter((p) => p.rsvp === "pending").length;
  const declined = data.participants.filter((p) => p.rsvp === "not_going").length;
  const alreadyDrawn = data.status === "drawn";
  const enough = going >= 3;

  return (
    <PartyLayout partyId={partyId} name={data.name} status={data.status}>
      <Stack gap={20}>
        <div className="stats">
          <Stat value={going} label="confirmados" />
          <Stat value={pending} label="aguardando" />
          <Stat value={declined} label="não vão" />
        </div>

        {alreadyDrawn || draw.isSuccess ? (
          <Card>
            <h2 className="section-title" style={{ margin: 0 }}>
              <span style={{ color: "var(--color-success-fg)", display: "inline-flex" }}>
                <Icon name="checkCircle" size={20} />
              </span>
              Sorteio realizado
            </h2>
            <p className="muted" style={{ marginTop: 6 }}>
              {draw.isSuccess
                ? `${draw.data.assignedCount} participantes receberam o link de revelação por e-mail.`
                : "Cada participante recebeu por e-mail um link pessoal com quem tirou."}
            </p>
          </Card>
        ) : (
          <Card>
            <Stack gap={16}>
              <h2 className="section-title" style={{ margin: 0 }}>
                Pronto pra sortear?
              </h2>
              {!enough ? (
                <Alert tone="warning">É preciso de pelo menos 3 participantes confirmados pra sortear.</Alert>
              ) : pending === 0 ? (
                <Alert tone="success">Todo mundo respondeu — tudo pronto pro sorteio.</Alert>
              ) : (
                <Alert tone="info">
                  {pending} {pending === 1 ? "pessoa ainda não respondeu" : "pessoas ainda não responderam"}. Depois do
                  prazo de confirmação, dá pra sortear só com quem confirmou.
                </Alert>
              )}
              <p className="hint">
                Ao sortear, cada confirmado recebe por e-mail um link pessoal com quem tirou. Não dá pra desfazer.
              </p>
              {draw.isError && (
                <ErrorBanner
                  message={draw.error instanceof ApiClientError ? draw.error.message : "Erro ao realizar o sorteio."}
                />
              )}
              <div className="form-actions">
                <Button
                  size="lg"
                  icon="shuffle"
                  loading={draw.isPending}
                  disabled={!enough}
                  onClick={() => {
                    if (window.confirm(`Sortear agora entre ${going} confirmados? Os e-mails saem na hora.`)) draw.mutate();
                  }}
                >
                  {draw.isPending ? "Sorteando…" : "Realizar sorteio"}
                </Button>
              </div>
            </Stack>
          </Card>
        )}
      </Stack>
    </PartyLayout>
  );
}

function Stat(props: { value: number; label: string }) {
  return (
    <div className="stat">
      <div className="stat__value">{props.value}</div>
      <div className="stat__label">{props.label}</div>
    </div>
  );
}
