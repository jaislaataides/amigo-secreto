import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { EmptyState } from "@/shared/components/Feedback";
import { Icon, type IconName } from "@/shared/components/Icon";
import { Page, PageHeader } from "@/shared/components/ui";

export function HomePage() {
  const { user, role } = useAuth();
  // Admin tem acesso a tudo que um owner tem — organizar parties incluso.
  const canOrganize = role.owner || role.admin;
  const firstName = user?.displayName?.split(" ")[0];

  return (
    <Page>
      <PageHeader title={firstName ? `Olá, ${firstName}!` : "Olá!"} subtitle="O que você quer fazer hoje?" />

      {canOrganize || role.admin ? (
        <div className="party-grid">
          {canOrganize && (
            <HomeCard
              to="/owner"
              icon="gift"
              title="Minhas parties"
              description="Criar e gerenciar seus amigos secretos."
            />
          )}
          {role.admin && (
            <HomeCard
              to="/admin"
              icon="shield"
              title="Painel do admin"
              description="Aprovar organizadores e ajustar limites de participantes."
            />
          )}
        </div>
      ) : (
        <EmptyState icon="mail" title="Procurando sua party?">
          Use o link que chegou no seu e-mail (convite ou resultado do sorteio).
          <br />
          Quer organizar um amigo secreto? <Link to="/solicitar-acesso">Peça acesso de organizador</Link>.
        </EmptyState>
      )}
    </Page>
  );
}

function HomeCard(props: { to: string; icon: IconName; title: string; description: string }) {
  return (
    <Link to={props.to} className="card card--interactive">
      <span className="empty__icon" style={{ background: "var(--color-primary-soft)", color: "var(--color-primary)" }}>
        <Icon name={props.icon} size={24} />
      </span>
      <div className="row row--between" style={{ marginTop: 12 }}>
        <h2 style={{ fontSize: 20 }}>{props.title}</h2>
        <Icon name="arrowRight" size={18} />
      </div>
      <p className="muted small" style={{ marginTop: 4 }}>
        {props.description}
      </p>
    </Link>
  );
}
