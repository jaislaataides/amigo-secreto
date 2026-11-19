import { Tabs } from "@/shared/components/ui";

export function ParticipantTabs(props: { partyId: string }) {
  const base = `/p/${props.partyId}`;
  return (
    <Tabs
      label="Seções da party"
      items={[
        { to: `${base}/rsvp`, label: "Confirmação" },
        { to: `${base}/preferences`, label: "Categorias" },
        { to: `${base}/references`, label: "Referências" },
      ]}
    />
  );
}
