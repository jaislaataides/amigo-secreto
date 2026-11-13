import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { FullPageSpinner } from "@/shared/components/Feedback";
import { useAuth } from "./AuthContext";

export function AuthGuard(props: { children: ReactNode; requireRole?: "admin" | "owner" }) {
  const { user, loading, role } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (props.requireRole && !role[props.requireRole]) {
    return (
      <div style={{ padding: 32, textAlign: "center", color: "#71717a" }}>
        <p>Você não tem permissão para acessar esta página.</p>
        {props.requireRole === "owner" && (
          <p>
            Se você deveria ser organizador, peça acesso em{" "}
            <a href="/solicitar-acesso">/solicitar-acesso</a>.
          </p>
        )}
      </div>
    );
  }

  return <>{props.children}</>;
}
