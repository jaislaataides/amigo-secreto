import { useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiClientError } from "@/shared/api/client";
import { Button, Card, Stack } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { Alert, ErrorBanner } from "@/shared/components/Feedback";
import { useConfirm } from "@/shared/components/ConfirmDialog";
import { PartyLayout, PartyLoadState } from "./PartyLayout";
import { usePartyDetail } from "./usePartyDetail";

export function PartyDrawPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const { data, isLoading, isError, error } = usePartyDetail(partyId);
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const draw = useMutation({
    mutationFn: () => api.post<{ assignedCount: number }>(`/api/parties/${partyId}/draw`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["owner", "party", partyId] }),
  });

  // Reenvia pra todo mundo de uma vez — pra reenviar só pra uma pessoa, ver a
  // aba Participantes.
  const resendResults = useMutation({
    mutationFn: () => api.post<{ sentCount: number; totalCount: number }>(`/api/parties/${partyId}/resend-results`),
  });

  if (!partyId) return null;
  if (isLoading || isError || !data) return <PartyLoadState isLoading={isLoading} error={error} />;

  const going = data.participants.filter((p) => p.rsvp === "going").length;
  const pending = data.participants.filter((p) => p.rsvp === "pending").length;
  const declined = data.participants.filter((p) => p.rsvp === "not_going").length;
  const alreadyDrawn = data.status === "drawn";
  const enough = going >= 3;

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

              {resendResults.isError && <ErrorBanner message={resendResults.error.message} />}
              {resendResults.isSuccess && (
                <Alert tone="success">
                  {resendResults.data.sentCount} de {resendResults.data.totalCount} e-mails reenviados.
                </Alert>
              )}
              <div className="form-actions">
                <Button
                  variant="secondary"
                  icon="mail"
                  loading={resendResults.isPending}
                  onClick={() => {
                    void confirm({
                      title: "Reenviar resultados pra todo mundo?",
                      message: "Cada confirmado recebe de novo o e-mail com o link de quem tirou (mesmo link de antes).",
                      confirmLabel: "Reenviar pra todos",
                    }).then((ok) => ok && resendResults.mutate());
                  }}
                >
                  {resendResults.isPending ? "Reenviando…" : "Reenviar resultados pra todo mundo"}
                </Button>
              </div>
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
                    void confirm({
                      title: `Sortear entre ${going} confirmados?`,
                      message:
                        "Cada um recebe na hora um e-mail com o link de quem tirou. Depois disso não dá pra desfazer nem sortear de novo.",
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
