import type { ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { EmptyState, FullPageSpinner } from "@/shared/components/Feedback";
import { ButtonLink, Page } from "@/shared/components/ui";
import { useAuth } from "./AuthContext";

export function AuthGuard(props: { children: ReactNode; requireRole?: "admin" | "owner" }) {
  const { user, loading, role } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Admin tem acesso a tudo que um owner tem — organizar parties incluso.
  const satisfiesRequiredRole = !props.requireRole || role[props.requireRole] || (props.requireRole === "owner" && role.admin);

  if (!satisfiesRequiredRole) {
    return (
      <Page maxWidth={520}>
        <EmptyState
          title="Sem permissão"
          action={<ButtonLink to="/home" variant="secondary">Voltar ao início</ButtonLink>}
        >
          Você não tem acesso a esta página.
          {props.requireRole === "owner" && (
            <>
              {" "}
              Se deveria ser organizador, <Link to="/solicitar-acesso">peça acesso aqui</Link>.
            </>
          )}
        </EmptyState>
      </Page>
    );
  }

  return <>{props.children}</>;
}
