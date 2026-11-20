import { Tabs } from "@/shared/components/ui";
import { useMyPartyView } from "./useMyPartyView";

export function ParticipantTabs(props: { partyId: string }) {
  const base = `/p/${props.partyId}`;
  // "Medidas" só aparece depois de aceitar o convite (dado já em cache).
  const me = useMyPartyView(props.partyId).data?.me;
  const going = me?.rsvp === "going";
  // O organizador já entra confirmado automaticamente (ver effectiveRsvp) —
  // a aba de confirmação não faz sentido pra ele.
  return (
    <Tabs
      label="Seções da party"
      items={[
        ...(me?.isOwner ? [] : [{ to: `${base}/rsvp`, label: "Confirmação", icon: "check" as const }]),
        { to: `${base}/preferences`, label: "Categorias", icon: "heart" },
        { to: `${base}/references`, label: "Referências", icon: "link" },
        ...(going ? [{ to: `${base}/sizes`, label: "Medidas", icon: "shirt" as const }] : []),
      ]}
    />
  );
}
