import { Tabs } from "@/shared/components/ui";

export function PartyTabs(props: { partyId: string }) {
  const base = `/owner/parties/${props.partyId}`;
  return (
    <Tabs
      label="Seções da party"
      items={[
        { to: `${base}/participants`, label: "Participantes" },
        { to: `${base}/edit`, label: "Regras" },
        { to: `${base}/exclusions`, label: "Exclusões" },
        { to: `${base}/draw`, label: "Sorteio" },
      ]}
    />
  );
}
