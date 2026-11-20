import { useState, type ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { MonkeyMark } from "@/shared/components/MonkeyMark";
import { BrandName } from "@/shared/components/BrandName";
import { cameFromSplash } from "./entryCue";
import { IconButton } from "@/shared/components/ui";

export function AppLayout(props: { children: ReactNode }) {
  const { user, role, signOutUser } = useAuth();
  const navigate = useNavigate();
  // Só depois da tela de entrada: o roxo dela recolhe até virar o cabeçalho.
  const [entering] = useState(cameFromSplash);

  return (
    <>
      {entering && <div className="entry-curtain" aria-hidden="true" />}
      <header className={entering ? "app-header app-header--entering" : "app-header"}>
        <div className="app-header__inner">
          <Link to="/home" className="brand">
            <span className="brand__mark">
              <MonkeyMark />
            </span>
            <BrandName />
          </Link>

          <nav className="app-nav" aria-label="Principal">
            <NavLink to="/home" className="app-nav__link">
              Início
            </NavLink>
            <NavLink to="/owner" className="app-nav__link">
              Minhas parties
            </NavLink>
            {role.admin && (
              <NavLink to="/admin" className="app-nav__link">
                Admin
              </NavLink>
            )}
          </nav>

          <div className="app-header__user">
            {user?.email && <span className="app-header__email">{user.email}</span>}
            <IconButton
              icon="logout"
              label="Sair"
              onClick={async () => {
                await signOutUser();
                // Explícito: em rotas guiadas pelo ParticipantGuard (ex: /p/:partyId/...),
                // sair não navega sozinho pra lugar nenhum — ficaria preso na mesma URL,
                // mostrando o aviso de login "de convite" em vez da tela real de entrada.
                navigate("/login", { replace: true });
              }}
            />
          </div>
        </div>
      </header>

      {props.children}
    </>
  );
}
