import { useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ApiClientError } from "@/shared/api/client";
import { Button, FormSection, Stack } from "@/shared/components/ui";
import { Alert, ErrorBanner } from "@/shared/components/Feedback";
import { useOverlay } from "@/shared/components/Overlay";
import { PartyLayout, PartyLoadState } from "./PartyLayout";
import { usePartyDetail } from "./usePartyDetail";

export function PartyDrawPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const { data, isLoading, isError, error } = usePartyDetail(partyId);
  const queryClient = useQueryClient();
  const { confirm } = useOverlay();

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
      <Stack gap={16}>
        <div className="card stats">
          <Stat value={going} label="confirmados" accent />
          <Stat value={pending} label="aguardando" />
          <Stat value={declined} label="não vão" />
        </div>

        {alreadyDrawn || draw.isSuccess ? (
          <FormSection title="Sorteio realizado">
            <p className="muted">
              {draw.isSuccess
                ? `${draw.data.assignedCount} participantes receberam o link de revelação por e-mail.`
                : "Cada participante recebeu por e-mail um link pessoal com quem tirou."}
            </p>
          </FormSection>
        ) : (
          <FormSection title="Pronto pra sortear?">
            {!enough ? (
              <Alert tone="warning">É preciso ter pelo menos 3 participantes confirmados pra sortear.</Alert>
            ) : pending === 0 ? (
              <Alert tone="success">Todo mundo respondeu. Tudo pronto pro sorteio.</Alert>
            ) : (
              <Alert tone="info">
                {pending} {pending === 1 ? "pessoa ainda não respondeu" : "pessoas ainda não responderam"}. Depois do
                prazo de confirmação, dá pra sortear só com quem confirmou.
              </Alert>
            )}
            <p className="muted">
              Ao sortear, cada confirmado recebe por e-mail um link pessoal com quem tirou. Não dá pra desfazer.
            </p>
            {draw.isError && (
              <ErrorBanner
                message={draw.error instanceof ApiClientError ? draw.error.message : "Erro ao realizar o sorteio."}
              />
            )}
            <div>
              <Button
                size="lg"
                loading={draw.isPending}
                disabled={!enough}
                onClick={async () => {
                  const ok = await confirm({
                    title: `Sortear entre ${going} confirmados?`,
                    body: "Cada um recebe na hora, por e-mail, o link com quem tirou. O sorteio não pode ser desfeito.",
                    confirmLabel: "Sortear agora",
                  });
                  if (ok) draw.mutate();
                }}
              >
                {draw.isPending ? "Sorteando…" : "Realizar sorteio"}
              </Button>
            </div>
          </FormSection>
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
