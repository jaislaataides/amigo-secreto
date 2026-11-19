import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { IconButton, Wordmark } from "@/shared/components/ui";

export function AppLayout(props: { children: ReactNode }) {
  const { user, role, signOutUser } = useAuth();
  // Admin tem acesso a tudo que um owner tem — organizar parties incluso.
  const canOrganize = role.owner || role.admin;

  return (
    <>
      <header className="app-header">
        <div className="app-header__inner">
          <Link to="/home" className="brand" aria-label="Amico Secreto — início">
            <Wordmark />
          </Link>

          <nav className="app-nav" aria-label="Principal">
            <NavLink to="/home" className="app-nav__link">
              Início
            </NavLink>
            {canOrganize && (
              <NavLink to="/owner" className="app-nav__link">
                Minhas parties
              </NavLink>
            )}
            {role.admin && (
              <NavLink to="/admin" className="app-nav__link">
                Admin
              </NavLink>
            )}
          </nav>

          <div className="app-header__user">
            {user?.email && <span className="app-header__email">{user.email}</span>}
            <IconButton icon="logout" label="Sair" onClick={() => void signOutUser()} />
          </div>
        </div>
      </header>

      {props.children}
    </>
  );
}
