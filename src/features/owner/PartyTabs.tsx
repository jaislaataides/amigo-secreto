import { Tabs } from "@/shared/components/ui";

export function PartyTabs(props: { partyId: string }) {
  const base = `/owner/parties/${props.partyId}`;
  return (
    <Tabs
      label="Seções da party"
      items={[
        { to: `${base}/participants`, label: "Participantes", icon: "users" },
        { to: `${base}/edit`, label: "Regras", icon: "sliders" },
        { to: `${base}/exclusions`, label: "Exclusões", icon: "ban" },
        { to: `${base}/draw`, label: "Sorteio", icon: "shuffle" },
        // Fora do /owner/parties/* de propósito: são as preferências pessoais
        // do organizador como participante, não regras da party (ver
        // ParticipantLayout, que mostra o caminho de volta pra cá).
        { to: `/p/${props.partyId}/preferences`, label: "Meu presente", icon: "gift" },
      ]}
    />
  );
}
