import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { EmptyState } from "@/shared/components/Feedback";
import { Icon } from "@/shared/components/Icon";
import { Page, PageHeader } from "@/shared/components/ui";

export function HomePage() {
  const { user, role } = useAuth();
  // Admin tem acesso a tudo que um owner tem — organizar parties incluso.
  const canOrganize = role.owner || role.admin;
  const firstName = user?.displayName?.split(" ")[0];

  return (
    <Page>
      <PageHeader title={firstName ? `Olá, ${firstName}` : "Olá"} />

      {canOrganize || role.admin ? (
        <ul className="rows card card--flush">
          {canOrganize && (
            <HomeRow to="/owner" title="Minhas parties" description="Criar e acompanhar seus amigos secretos." />
          )}
          {role.admin && (
            <HomeRow
              to="/admin"
              title="Painel do admin"
              description="Aprovar organizadores e ajustar limites de participantes."
            />
          )}
        </ul>
      ) : (
        <EmptyState title="Procurando sua party?">
          Use o link que chegou no seu e-mail (convite ou resultado do sorteio). Quer organizar um amigo secreto?{" "}
          <Link to="/solicitar-acesso">Peça acesso de organizador</Link>.
        </EmptyState>
      )}
    </Page>
  );
}

function HomeRow(props: { to: string; title: string; description: string }) {
  return (
    <li>
      <Link to={props.to} className="row-item">
        <div className="row-item__main">
          <div className="row-item__title">{props.title}</div>
          <div className="row-item__meta">{props.description}</div>
        </div>
        <Icon name="arrowRight" size={18} />
      </Link>
    </li>
  );
}
