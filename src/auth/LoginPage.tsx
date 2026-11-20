import { Link, Navigate, useLocation, type Location } from "react-router-dom";
import { Alert } from "@/shared/components/Feedback";
import { AppSplash } from "./AppSplash";
import { Stack } from "@/shared/components/ui";
import { AuthShell } from "./AuthShell";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { takeReturnPath } from "./returnPath";
import { useAuth } from "./AuthContext";

export function LoginPage() {
  const { user, loading, unauthorized } = useAuth();
  const location = useLocation();
  const fromState = (location.state as { from?: Location } | null)?.from;

  if (loading) return <AppSplash />;

  if (user) {
    // Quem chegou aqui via AuthGuard (ex: link de convite/revelação sem
    // estar logado) volta pro link original em vez da home — vale pra
    // qualquer papel, não só participante.
    // Fallback no sessionStorage: o estado da navegação se perde se a
    // página recarregar durante o login (ex: login por redirecionamento).
    const target = fromState ? `${fromState.pathname}${fromState.search}` : takeReturnPath();
    return <Navigate to={target ?? "/home"} replace />;
  }

  return (
    <AuthShell>
      <Stack gap={20}>
        <div>
          <h1 className="sr-only">Amico Secreto</h1>
          <h2>Entrar</h2>
          <p className="muted" style={{ marginTop: 6 }}>
            Use a conta Google do e-mail em que você recebeu o convite.
          </p>
        </div>

        {unauthorized && (
          <Alert tone="warning">
            Esse e-mail não tem acesso a nada por aqui (não é organizador, admin, nem participante de nenhuma party).
            Peça pra quem organiza te cadastrar, ou <Link to="/solicitar-acesso">solicite virar organizador</Link>.
          </Alert>
        )}

        <GoogleSignInButton />

        <p className="hint">
          Quer organizar um amigo secreto? <Link to="/solicitar-acesso">Peça acesso de organizador</Link>
        </p>
      </Stack>
    </AuthShell>
  );
}
