import { Link, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { Stack } from "@/shared/components/ui";
import { ErrorBanner } from "@/shared/components/Feedback";
import { Icon } from "@/shared/components/Icon";
import { useOverlay } from "@/shared/components/Overlay";
import { ParticipantLayout, ParticipantLoadState } from "./ParticipantLayout";
import { useMyPartyView } from "./useMyPartyView";

export function ParticipantRsvpPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const { data, isLoading, isError, error } = useMyPartyView(partyId);
  const queryClient = useQueryClient();
  const { toast } = useOverlay();

  const confirm = useMutation({
    mutationFn: (rsvp: "going" | "not_going") => api.post(`/api/parties/${partyId}/me/confirm`, { rsvp }),
    onSuccess: (_data, rsvp) => {
      toast(rsvp === "going" ? "Presença confirmada" : "Resposta registrada");
      void queryClient.invalidateQueries({ queryKey: ["participant", "me", partyId] });
    },
  });

  if (!partyId) return null;
  if (isLoading || isError || !data) return <ParticipantLoadState isLoading={isLoading} error={error} />;

  const { party, me } = data;
  // Mostra a escolha otimista enquanto a requisição está em andamento.
  const current = confirm.isPending ? confirm.variables : me.rsvp;

  return (
    <ParticipantLayout partyId={partyId} name={party.name} imageUrl={party.imageUrl} subtitle={party.description}>
      <Stack gap={24}>
        <div className="card rules">
          <div className="rules__item">
            <div className="rules__label">Valor do presente</div>
            <div className="rules__value">
              R$ {party.valueRange.min}–{party.valueRange.max}
            </div>
          </div>
          {party.forbiddenItemsText && (
            <div className="rules__item">
              <div className="rules__label">Lista de micos</div>
              <p style={{ marginTop: 4 }}>{party.forbiddenItemsText}</p>
            </div>
          )}
        </div>

        <section>
          <h2 className="section-title">Você vai participar?</h2>
          <div className="choices" role="group" aria-label="Confirmação de presença">
            <Choice
              kind="yes"
              label="Vou participar"
              pressed={current === "going"}
              disabled={confirm.isPending}
              onClick={() => confirm.mutate("going")}
            />
            <Choice
              kind="no"
              label="Não vou dessa vez"
              pressed={current === "not_going"}
              disabled={confirm.isPending}
              onClick={() => confirm.mutate("not_going")}
            />
          </div>
          <p className="hint" style={{ marginTop: 12 }}>
            O resultado do sorteio chega no seu e-mail, num link pessoal que só você consegue abrir.
          </p>
        </section>

        {confirm.isError && <ErrorBanner message={confirm.error.message} />}

        {current === "going" && (
          <section className="enter">
            <h2 className="section-title">Agora, dê pistas pra quem te tirar</h2>
            <div className="next-steps">
              <Link to={`/p/${partyId}/preferences`} className="card next-step">
                <span>
                  <strong>Categorias</strong>
                  <span className="hint">
                    {me.preferredCategories.length > 0
                      ? `${me.preferredCategories.length} marcadas`
                      : "Que tipo de presente você curte"}
                  </span>
                </span>
                <Icon name="arrowRight" size={18} />
              </Link>
              <Link to={`/p/${partyId}/references`} className="card next-step">
                <span>
                  <strong>Referências</strong>
                  <span className="hint">
                    {me.referenceLinks.length > 0
                      ? `${me.referenceLinks.length} ${me.referenceLinks.length === 1 ? "link" : "links"}`
                      : "Links do que você quer ganhar"}
                  </span>
                </span>
                <Icon name="arrowRight" size={18} />
              </Link>
            </div>
          </section>
        )}
      </Stack>
    </ParticipantLayout>
  );
}

function Choice(props: {
  kind: "yes" | "no";
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
      <span className="choice__radio" aria-hidden="true" />
      {props.label}
    </button>
  );
}
