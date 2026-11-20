import { Tabs } from "@/shared/components/ui";
import type { IconName } from "@/shared/components/Icon";
import { useMyPartyView } from "./useMyPartyView";

export type ParticipantStepKey = "rsvp" | "preferences" | "references" | "sizes";

export interface ParticipantStep {
  key: ParticipantStepKey;
  to: string;
  label: string;
  icon: IconName;
}

/**
 * Ordem das etapas do participante — usada tanto nas abas quanto no botão
 * "Próximo" ao fim de cada página (ver ParticipantStepNav). O organizador já
 * entra confirmado automaticamente (ver effectiveRsvp), então "Confirmação"
 * não aparece pra ele; "Medidas" só aparece pra quem vai participar.
 */
export function participantSteps(partyId: string, me: { isOwner: boolean; rsvp: string } | undefined): ParticipantStep[] {
  const base = `/p/${partyId}`;
  const going = me?.rsvp === "going";
  return [
    ...(me?.isOwner ? [] : [{ key: "rsvp" as const, to: `${base}/rsvp`, label: "Confirmação", icon: "check" as const }]),
    { key: "preferences", to: `${base}/preferences`, label: "Categorias", icon: "heart" },
    { key: "references", to: `${base}/references`, label: "Referências", icon: "link" },
    ...(going ? [{ key: "sizes" as const, to: `${base}/sizes`, label: "Medidas", icon: "shirt" as const }] : []),
  ];
}

export function ParticipantTabs(props: { partyId: string }) {
  const me = useMyPartyView(props.partyId).data?.me;
  return <Tabs label="Seções da party" items={participantSteps(props.partyId, me)} />;
}
