import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { Page, PageHeader } from "@/shared/components/ui";

export function HomePage() {
  const { user, role } = useAuth();
  // Admin tem acesso a tudo que um owner tem — organizar parties incluso.
  const canOrganize = role.owner || role.admin;
  const hasAnyRole = role.admin || canOrganize;

  return (
    <Page>
      <PageHeader title={`Olá, ${user?.email ?? ""}`} subtitle="O que você quer fazer?" />

      {hasAnyRole ? (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {role.admin && (
            <HomeCard
              to="/admin"
              title="Painel do admin"
              description="Aprovar pedidos de organizador e ajustar limites de participantes."
            />
          )}
          {canOrganize && (
            <HomeCard
              to="/owner"
              title="Minhas parties"
              description="Criar e gerenciar suas parties de amigo secreto."
            />
          )}
        </div>
      ) : (
        <p style={{ color: "#71717a" }}>
          Para acessar uma party, use o link que você recebeu por e-mail (convite ou resultado do sorteio).
          Quer organizar um amigo secreto?{" "}
          <Link to="/solicitar-acesso" style={{ color: "#18181b" }}>
            Peça acesso de organizador
          </Link>
          .
        </p>
      )}
    </Page>
  );
}

function HomeCard(props: { to: string; title: string; description: string }) {
  return (
    <Link
      to={props.to}
      style={{
        display: "block",
        width: 260,
        padding: 20,
        borderRadius: 12,
        border: "1px solid #e4e4e7",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <strong style={{ fontSize: 16 }}>{props.title}</strong>
      <p style={{ color: "#71717a", fontSize: 13, marginTop: 6 }}>{props.description}</p>
    </Link>
  );
}
