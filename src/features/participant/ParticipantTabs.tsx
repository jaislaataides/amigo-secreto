import { NavLink } from "react-router-dom";

const TABS = [
  { suffix: "rsvp", label: "Confirmação" },
  { suffix: "preferences", label: "Categorias" },
  { suffix: "references", label: "Referências" },
];

export function ParticipantTabs(props: { partyId: string }) {
  return (
    <nav style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid #e4e4e7" }}>
      {TABS.map((tab) => (
        <NavLink
          key={tab.suffix}
          to={`/p/${props.partyId}/${tab.suffix}`}
          style={({ isActive }) => ({
            padding: "10px 14px",
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
            color: isActive ? "#18181b" : "#71717a",
            borderBottom: isActive ? "2px solid #18181b" : "2px solid transparent",
          })}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
