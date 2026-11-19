import { Tabs } from "@/shared/components/ui";

export function ParticipantTabs(props: { partyId: string }) {
  const base = `/p/${props.partyId}`;
  return (
    <Tabs
      label="Seções da party"
      items={[
        { to: `${base}/rsvp`, label: "Confirmação", icon: "check" },
        { to: `${base}/preferences`, label: "Categorias", icon: "heart" },
        { to: `${base}/references`, label: "Referências", icon: "link" },
      ]}
    />
  );
}
