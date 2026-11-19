import { Navigate, useLocation, type Location } from "react-router-dom";
import { useState, type CSSProperties } from "react";
import { FullPageSpinner } from "@/shared/components/Feedback";
import { useAuth } from "./AuthContext";

export function LoginPage() {
  const { user, loading, unauthorized, signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
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
    <main style={pageStyle}>
      <h1 style={titleStyle}>🎁 Amigo Secreto</h1>
      <p style={{ color: "#52525b", marginBottom: 24 }}>Organize o amigo secreto do seu grupo, sem complicação.</p>
      {unauthorized && (
        <p style={{ color: "#991b1b", marginBottom: 16, fontSize: 14 }}>
          Esse e-mail não tem acesso a nada neste app (não é organizador, admin, nem participante de nenhuma
          party). Se você deveria ter acesso, peça pra quem organiza te cadastrar, ou{" "}
          <a href="/solicitar-acesso">solicite virar organizador</a>.
        </p>
      )}
      <button
        onClick={async () => {
          setError(null);
          try {
            await signInWithGoogle();
          } catch {
            setError("Não foi possível entrar com o Google. Tente novamente.");
          }
        }}
        style={googleButtonStyle}
      >
        Entrar com o Google
      </button>
      {error && <p style={{ color: "#991b1b", marginTop: 12 }}>{error}</p>}
    </main>
  );
}

const pageStyle: CSSProperties = {
  maxWidth: 420,
  margin: "15vh auto",
  padding: "0 24px",
  textAlign: "center",
};

const titleStyle: CSSProperties = {
  fontSize: 28,
  marginBottom: 8,
};

const googleButtonStyle: CSSProperties = {
  background: "#18181b",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "12px 24px",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
};
