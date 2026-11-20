import { ButtonLink } from "@/shared/components/ui";
import { participantSteps, type ParticipantStepKey } from "./ParticipantTabs";

/** Botão de avançar pra próxima etapa, ao fim de cada página de participante. */
export function ParticipantStepNav(props: {
  partyId: string;
  currentKey: ParticipantStepKey;
  me: { isOwner: boolean; rsvp: string };
}) {
  const steps = participantSteps(props.partyId, props.me);
  const currentIndex = steps.findIndex((s) => s.key === props.currentKey);
  const next = steps[currentIndex + 1];

  return (
    <div className="form-actions" style={{ justifyContent: "flex-end" }}>
      {next ? (
        <ButtonLink to={next.to} icon="arrowRight">
          Próximo: {next.label}
        </ButtonLink>
      ) : (
        <ButtonLink
          to={props.me.isOwner ? `/owner/parties/${props.partyId}/participants` : "/home"}
          icon="check"
        >
          Concluir
        </ButtonLink>
      )}
    </div>
  );
}
