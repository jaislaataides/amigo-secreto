import { Navigate, useLocation, type Location } from "react-router-dom";
import { useState, type CSSProperties } from "react";
import { FullPageSpinner } from "@/shared/components/Feedback";
import { useAuth } from "./AuthContext";

export function LoginPage() {
  const { user, loading, role, unauthorized, signInWithGoogle, signOutUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const from = (location.state as { from?: Location } | null)?.from;

  if (loading) return <FullPageSpinner />;

  if (user) {
    // Quem chegou aqui via AuthGuard (ex: link de convite/revelação sem
    // estar logado) volta pro link original em vez de cair num dashboard
    // genérico — isso vale pra qualquer papel, não só participante.
    if (from) return <Navigate to={`${from.pathname}${from.search}`} replace />;
    if (role.admin) return <Navigate to="/admin" replace />;
    if (role.owner) return <Navigate to="/owner" replace />;
    return (
      <main style={pageStyle}>
        <h1 style={titleStyle}>🎁 Amigo Secreto</h1>
        <p style={{ color: "#52525b" }}>
          Você está logado como <strong>{user.email}</strong>.
        </p>
        <p style={{ color: "#71717a", fontSize: 14 }}>
          Para acessar uma party, use o link que você recebeu por e-mail (convite ou resultado do sorteio).
        </p>
        <p style={{ fontSize: 14 }}>
          Quer organizar um amigo secreto? <a href="/solicitar-acesso">Peça acesso de organizador</a>.
        </p>
        <button onClick={() => void signOutUser()} style={linkButtonStyle}>
          Sair
        </button>
      </main>
    );
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

const linkButtonStyle: CSSProperties = {
  background: "none",
  border: "none",
  color: "#71717a",
  textDecoration: "underline",
  cursor: "pointer",
  marginTop: 16,
};
