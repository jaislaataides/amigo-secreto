import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { Alert, FullPageSpinner } from "@/shared/components/Feedback";
import { Button, Stack } from "@/shared/components/ui";
import { AuthShell } from "./AuthShell";
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
    <AuthShell>
      <Stack gap={20}>
        <div>
          <h1>Quero organizar</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            Organizadores criam parties e convidam o grupo. Um admin aprova o pedido antes.
          </p>
        </div>

        {!user && (
          <Button size="lg" block onClick={() => void signInWithGoogle()}>
            Entrar com o Google pra continuar
          </Button>
        )}

        {user && !done && (
          <div>
            <Button size="lg" block loading={mutation.isPending} onClick={() => mutation.mutate()}>
              {mutation.isPending ? "Enviando…" : "Solicitar acesso"}
            </Button>
            <p className="hint" style={{ marginTop: 8 }}>
              Como <strong>{user.email}</strong>
            </p>
          </div>
        )}

        {mutation.isError && <Alert tone="error">{mutation.error.message}</Alert>}

        {done && (
          <Alert tone="success">
            {done === "approved"
              ? "Você já é um organizador aprovado. Recarregue a página."
              : "Pedido enviado! Avisaremos quando um admin aprovar."}
          </Alert>
        )}

        <p className="hint">
          <Link to={user ? "/home" : "/"}>Voltar ao início</Link>
        </p>
      </Stack>
    </AuthShell>
  );
}
