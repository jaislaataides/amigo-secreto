import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { Alert, FullPageSpinner } from "@/shared/components/Feedback";
import { Button, Card } from "@/shared/components/ui";
import { useAuth } from "./AuthContext";

export function RequestOwnerAccessPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const [done, setDone] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => api.post<{ status: string }>("/api/owners/request"),
    onSuccess: (data) => setDone(data.status),
  });

  if (loading) return <FullPageSpinner />;

  return (
    <main className="center-screen">
      <Card className="auth-card">
        <h1 style={{ fontSize: 28 }}>Quero organizar</h1>
        <p className="muted" style={{ margin: "8px 0 28px" }}>
          Organizadores criam parties de amigo secreto e convidam o grupo. Um admin aprova seu pedido antes.
        </p>

        {!user && (
          <Button size="lg" block onClick={() => void signInWithGoogle()}>
            Entrar com o Google pra continuar
          </Button>
        )}

        {user && !done && (
          <Button size="lg" block loading={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? "Enviando…" : "Solicitar acesso"}
          </Button>
        )}
        {user && !done && (
          <p className="hint" style={{ marginTop: 8 }}>
            Como <strong>{user.email}</strong>
          </p>
        )}

        {mutation.isError && (
          <div style={{ marginTop: 16, textAlign: "left" }}>
            <Alert tone="error">{mutation.error.message}</Alert>
          </div>
        )}

        {done && (
          <div style={{ textAlign: "left" }}>
            <Alert tone="success">
              {done === "approved"
                ? "Você já é um organizador aprovado — recarregue a página."
                : "Pedido enviado! Avisaremos quando um admin aprovar."}
            </Alert>
          </div>
        )}

        <p className="hint" style={{ marginTop: 24 }}>
          <Link to={user ? "/home" : "/"}>Voltar ao início</Link>
        </p>
      </Card>
    </main>
  );
}
