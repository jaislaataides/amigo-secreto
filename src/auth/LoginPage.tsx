import { Link, Navigate, useLocation, type Location } from "react-router-dom";
import { useState } from "react";
import { Alert, FullPageSpinner } from "@/shared/components/Feedback";
import { Card, Wordmark } from "@/shared/components/ui";
import { useAuth } from "./AuthContext";

export function LoginPage() {
  const { user, loading, unauthorized, signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const location = useLocation();
  const from = (location.state as { from?: Location } | null)?.from;

  if (loading) return <FullPageSpinner />;

  if (user) {
    // Quem chegou aqui via AuthGuard (ex: link de convite/revelação sem
    // estar logado) volta pro link original em vez da home — vale pra
    // qualquer papel, não só participante.
    return <Navigate to={from ? `${from.pathname}${from.search}` : "/home"} replace />;
  }

  return (
    <main className="center-screen">
      <Card className="auth-card">
        <h1>
          <Wordmark />
        </h1>
        <p className="muted" style={{ margin: "10px 0 28px" }}>
          O amigo secreto em que ninguém paga mico: sorteio sem spoiler, lista do que não dar e dicas de quem você
          tirou.
        </p>

        {from && !unauthorized && (
          <div style={{ marginBottom: 16, textAlign: "left" }}>
            <Alert tone="info">Entre com a conta do e-mail em que você recebeu o convite.</Alert>
          </div>
        )}

        {unauthorized && (
          <div style={{ marginBottom: 16, textAlign: "left" }}>
            <Alert tone="warning">
              Esse e-mail não tem acesso a nada por aqui (não é organizador, admin, nem participante de nenhuma
              party). Peça pra quem organiza te cadastrar, ou{" "}
              <Link to="/solicitar-acesso">solicite virar organizador</Link>.
            </Alert>
          </div>
        )}

        <button
          type="button"
          className="btn btn--google btn--lg btn--block"
          disabled={signingIn}
          aria-busy={signingIn || undefined}
          onClick={async () => {
            setError(null);
            setSigningIn(true);
            try {
              await signInWithGoogle();
            } catch {
              setError("Não foi possível entrar com o Google. Tente novamente.");
            } finally {
              setSigningIn(false);
            }
          }}
        >
          {signingIn ? <span className="spinner" aria-hidden="true" /> : <GoogleMark />}
          Entrar com o Google
        </button>

        {error && (
          <div style={{ marginTop: 12, textAlign: "left" }}>
            <Alert tone="error">{error}</Alert>
          </div>
        )}

        <p className="hint" style={{ marginTop: 24 }}>
          Quer organizar um amigo secreto? <Link to="/solicitar-acesso">Peça acesso de organizador</Link>
        </p>
      </Card>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  );
}
