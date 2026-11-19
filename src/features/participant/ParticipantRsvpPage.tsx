import { useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { Stack } from "@/shared/components/ui";
import { Alert, ErrorBanner } from "@/shared/components/Feedback";
import { Icon } from "@/shared/components/Icon";
import { ParticipantLayout, ParticipantLoadState } from "./ParticipantLayout";
import { useMyPartyView } from "./useMyPartyView";

export function ParticipantRsvpPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const { data, isLoading, isError, error } = useMyPartyView(partyId);
  const queryClient = useQueryClient();

  const confirm = useMutation({
    mutationFn: (rsvp: "going" | "not_going") => api.post(`/api/parties/${partyId}/me/confirm`, { rsvp }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["participant", "me", partyId] }),
  });

  if (!partyId) return null;
  if (isLoading || isError || !data) return <ParticipantLoadState isLoading={isLoading} error={error} />;

  const { party, me } = data;
  // Mostra a escolha otimista enquanto a requisição está em andamento.
  const current = confirm.isPending ? confirm.variables : me.rsvp;

  return (
    <ParticipantLayout partyId={partyId} view={data} subtitle={party.description}>
      <Stack gap={24}>
        <section>
          <h2 className="section-title">Você vai participar?</h2>
          <div className="choices" role="group" aria-label="Confirmação de presença">
            <Choice
              label="Vou participar"
              detail="Entro no sorteio"
              pressed={current === "going"}
              disabled={confirm.isPending}
              onClick={() => confirm.mutate("going")}
            />
            <Choice
              label="Não vou dessa vez"
              detail="Fico de fora do sorteio"
              pressed={current === "not_going"}
              disabled={confirm.isPending}
              onClick={() => confirm.mutate("not_going")}
            />
          </div>
          <p className="hint" style={{ marginTop: 12, display: "flex", gap: 6, alignItems: "flex-start" }}>
            <Icon name="lock" size={16} />
            O resultado do sorteio chega no seu e-mail, num link pessoal — ninguém mais consegue abrir.
          </p>
        </section>

        {confirm.isError && <ErrorBanner message={confirm.error.message} />}
        {confirm.isSuccess && me.rsvp === "going" && (
          <Alert tone="success">
            Presença confirmada. Aproveite pra marcar suas categorias e deixar referências de presente.
          </Alert>
        )}
      </Stack>
    </ParticipantLayout>
  );
}

function Choice(props: { label: string; detail: string; pressed: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      className="choice"
      aria-pressed={props.pressed}
      disabled={props.disabled}
      onClick={props.onClick}
    >
      <span className="choice__radio" aria-hidden="true" />
      <span className="choice__text">
        {props.label}
        <small>{props.detail}</small>
      </span>
    </button>
  );
}
