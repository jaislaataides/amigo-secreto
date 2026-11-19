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
    <Link to={props.to} className="card card--interactive home-link">
      <span className="home-link__icon">
        <Icon name={props.icon} size={24} />
      </span>
      <span>
        <span className="party-card__name" style={{ display: "block" }}>
          {props.title}
        </span>
        <span className="muted small">{props.description}</span>
      </span>
      <span className="home-link__arrow">
        <Icon name="arrowRight" size={20} />
      </span>
    </Link>
  );
}
