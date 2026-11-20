import { useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiClientError } from "@/shared/api/client";
import { Button, Card, Stack } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { Alert, ErrorBanner } from "@/shared/components/Feedback";
import { useConfirm } from "@/shared/components/ConfirmDialog";
import { PartyLayout, PartyLoadState } from "./PartyLayout";
import { usePartyDetail } from "./usePartyDetail";

function deadlineMillis(deadline: { _seconds: number; _nanoseconds: number } | string): number {
  if (typeof deadline === "string") return new Date(deadline).getTime();
  return deadline._seconds * 1000;
}

export function PartyDrawPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const { data, isLoading, isError, error } = usePartyDetail(partyId);
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const draw = useMutation({
    mutationFn: () => api.post<{ assignedCount: number; redraw: boolean }>(`/api/parties/${partyId}/draw`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["owner", "party", partyId] }),
  });

  if (!partyId) return null;
  if (isLoading || isError || !data) return <PartyLoadState isLoading={isLoading} error={error} />;

  const going = data.participants.filter((p) => p.rsvp === "going").length;
  const pending = data.participants.filter((p) => p.rsvp === "pending").length;
  const declined = data.participants.filter((p) => p.rsvp === "not_going").length;
  const alreadyDrawn = data.status === "drawn";
  const enough = going >= 3;
  const canRedraw = alreadyDrawn && Date.now() < deadlineMillis(data.rsvpDeadline);

  return (
    <PartyLayout partyId={partyId} name={data.name} status={data.status} isOwner={data.isOwner}>
      <Stack gap={20}>
        <div className="stats">
          <Stat value={going} label="confirmados" accent />
          <Stat value={pending} label="aguardando" />
          <Stat value={declined} label="não vão" />
        </div>

        {alreadyDrawn || draw.isSuccess ? (
          <Card>
            <Stack gap={16}>
              <div className="home-link" style={{ alignItems: "flex-start" }}>
                <span className="home-link__icon">
                  <Icon name="check" size={24} strokeWidth={2.5} />
                </span>
                <div>
                  <h2 className="section-title" style={{ margin: 0 }}>
                    Sorteio realizado
                  </h2>
                  <p className="muted" style={{ marginTop: 4 }}>
                    {draw.isSuccess
                      ? `${draw.data.assignedCount} participantes receberam o link de revelação por e-mail.`
                      : "Cada participante recebeu por e-mail um link pessoal com quem tirou."}
                  </p>
                </div>
              </div>

              {canRedraw && (
                <>
                  {draw.isError && (
                    <ErrorBanner
                      message={
                        draw.error instanceof ApiClientError ? draw.error.message : "Erro ao sortear novamente."
                      }
                    />
                  )}
                  <div className="form-actions">
                    <Button
                      variant="secondary"
                      icon="shuffle"
                      loading={draw.isPending}
                      onClick={() => {
                        void confirm({
                          title: "Sortear novamente?",
                          message:
                            "Os links de revelação antigos deixam de funcionar e todo mundo recebe um novo por e-mail. Só dá pra fazer isso antes do prazo de confirmação vencer.",
                          confirmLabel: "Sortear novamente",
                        }).then((ok) => ok && draw.mutate());
                      }}
                    >
                      {draw.isPending ? "Sorteando…" : "Sortear novamente"}
                    </Button>
                  </div>
                  <p className="hint">
                    Disponível até {new Date(deadlineMillis(data.rsvpDeadline)).toLocaleDateString("pt-BR")}.
                  </p>
                </>
              )}
            </Stack>
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
                Ao sortear, cada confirmado recebe por e-mail um link pessoal com quem tirou. Dá pra sortear de novo
                até o prazo de confirmação vencer, se precisar.
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
                    void confirm({
                      title: `Sortear entre ${going} confirmados?`,
                      message:
                        "Cada um recebe na hora um e-mail com o link de quem tirou. Dá pra sortear de novo até o prazo de confirmação vencer.",
                      confirmLabel: "Sortear agora",
                    }).then((ok) => ok && draw.mutate());
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

function Stat(props: { value: number; label: string; accent?: boolean }) {
  return (
    <div className={props.accent ? "stat stat--accent" : "stat"}>
      <div className="stat__value">{props.value}</div>
      <div className="stat__label">{props.label}</div>
    </div>
  );
}
