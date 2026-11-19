import { Tabs } from "@/shared/components/ui";
import { useMyPartyView } from "./useMyPartyView";

export function ParticipantTabs(props: { partyId: string }) {
  const base = `/p/${props.partyId}`;
  // "Medidas" só aparece depois de aceitar o convite (dado já em cache).
  const going = useMyPartyView(props.partyId).data?.me.rsvp === "going";
  return (
    <Tabs
      label="Seções da party"
      items={[
        { to: `${base}/rsvp`, label: "Confirmação", icon: "check" },
        { to: `${base}/preferences`, label: "Categorias", icon: "heart" },
        { to: `${base}/references`, label: "Referências", icon: "link" },
        ...(going ? [{ to: `${base}/sizes`, label: "Medidas", icon: "shirt" as const }] : []),
      ]}
    />
  );
}
