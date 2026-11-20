import { useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { Badge, Stack } from "@/shared/components/ui";
import { Alert, ErrorBanner } from "@/shared/components/Feedback";
import { Icon, type IconName } from "@/shared/components/Icon";
import { ParticipantLayout, ParticipantLoadState } from "./ParticipantLayout";
import { ParticipantStepNav } from "./ParticipantStepNav";
import { useMyPartyView } from "./useMyPartyView";
import { parseMicos } from "@/shared/micos";

export function ParticipantRsvpPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const { data, isLoading, isError, error } = useMyPartyView(partyId);
  const queryClient = useQueryClient();

  const confirm = useMutation({
    mutationFn: (rsvp: "going" | "not_going") => api.post(`/api/parties/${partyId}/me/confirm`, { rsvp }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["participant", "me", partyId] });
      // A resposta aparece na pill do card em "Minhas parties".
      void queryClient.invalidateQueries({ queryKey: ["participant", "invited"] });
    },
  });

  if (!partyId) return null;
  if (isLoading || isError || !data) return <ParticipantLoadState isLoading={isLoading} error={error} />;

  const { party, me } = data;
  // Mostra a escolha otimista enquanto a requisição está em andamento.
  const current = confirm.isPending ? confirm.variables : me.rsvp;

  return (
    <ParticipantLayout
      partyId={partyId}
      name={party.name}
      imageUrl={party.imageUrl}
      subtitle={party.description}
      isOwner={me.isOwner}
      partyStatus={party.status}
    >
      <Stack gap={24}>
        <div className="rules slip">
          <div className="rules__item">
            <div className="rules__label">Valor do presente</div>
            <div className="rules__value">
              R$ {party.valueRange.min}–{party.valueRange.max}
            </div>
          </div>
          {party.forbiddenItemsText && (
            <div className="rules__item">
              <div className="rules__label">Lista de micos</div>
              <div className="row" style={{ gap: 6, marginTop: 6 }}>
                {parseMicos(party.forbiddenItemsText).map((m) => (
                  <Badge key={m}>{m}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <section>
          <h2 className="section-title">Você vai participar?</h2>
          <div className="choices" role="group" aria-label="Confirmação de presença">
            <Choice
              kind="yes"
              icon="thumbsUp"
              label="Vou participar"
              pressed={current === "going"}
              disabled={confirm.isPending}
              onClick={() => confirm.mutate("going")}
            />
            <Choice
              kind="no"
              icon="x"
              label="Não vou dessa vez"
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
            Presença confirmada! Aproveite pra marcar suas categorias favoritas e deixar referências de presente.
          </Alert>
        )}
        <ParticipantStepNav partyId={partyId} currentKey="rsvp" me={me} />
      </Stack>
    </ParticipantLayout>
  );
}

function Choice(props: {
  kind: "yes" | "no";
  icon: IconName;
  label: string;
  pressed: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`choice choice--${props.kind}`}
      aria-pressed={props.pressed}
      disabled={props.disabled}
      onClick={props.onClick}
    >
      <span className="choice__icon">
        <Icon name={props.pressed ? "check" : props.icon} />
      </span>
      {props.label}
    </button>
  );
}
