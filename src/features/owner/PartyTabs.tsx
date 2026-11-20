import { Tabs } from "@/shared/components/ui";

export function PartyTabs(props: { partyId: string; isOwner?: boolean }) {
  const base = `/owner/parties/${props.partyId}`;
  return (
    <Tabs
      label="Seções da party"
      items={[
        { to: `${base}/participants`, label: "Participantes", icon: "users" },
        { to: `${base}/edit`, label: "Regras", icon: "sliders" },
        { to: `${base}/exclusions`, label: "Exclusões", icon: "ban" },
        { to: `${base}/draw`, label: "Sorteio", icon: "shuffle" },
        // Só pra quem criou a party: um admin gerenciando a party de outra
        // pessoa não é participante dela, não tem "presente" pra preencher.
        ...(props.isOwner ? [{ to: `${base}/my-gift`, label: "Meu presente", icon: "gift" as const }] : []),
      ]}
    />
  );
}
