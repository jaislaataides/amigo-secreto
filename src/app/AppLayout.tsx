import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

export function AppLayout(props: { children: ReactNode }) {
  const { user, role, signOutUser } = useAuth();
  // Admin tem acesso a tudo que um owner tem — organizar parties incluso.
  const canOrganize = role.owner || role.admin;

  return (
    <div style={{ minHeight: "100vh" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          borderBottom: "1px solid #e4e4e7",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link to="/home" style={{ fontWeight: 700, fontSize: 16, textDecoration: "none", color: "inherit" }}>
            🎁 Amigo Secreto
          </Link>
          <nav style={{ display: "flex", gap: 16 }}>
            <HeaderLink to="/home">Início</HeaderLink>
            {role.admin && <HeaderLink to="/admin">Painel admin</HeaderLink>}
            {canOrganize && <HeaderLink to="/owner">Minhas parties</HeaderLink>}
          </nav>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "#71717a" }}>
          {user?.email && <span>{user.email}</span>}
          <button
            onClick={() => void signOutUser()}
            style={{ background: "none", border: "none", color: "#71717a", textDecoration: "underline", cursor: "pointer", fontSize: 13 }}
          >
            Sair
          </button>
        </div>
      </header>

      {props.children}
    </div>
  );
}

function HeaderLink(props: { to: string; children: ReactNode }) {
  return (
    <NavLink
      to={props.to}
      style={({ isActive }) => ({
        fontSize: 14,
        fontWeight: 600,
        textDecoration: "none",
        color: isActive ? "#18181b" : "#71717a",
      })}
    >
      {props.children}
    </NavLink>
  );
}
