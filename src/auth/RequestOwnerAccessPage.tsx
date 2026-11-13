import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { FullPageSpinner } from "@/shared/components/Feedback";
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
    <main style={{ maxWidth: 480, margin: "15vh auto", padding: "0 24px", textAlign: "center" }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Solicitar acesso de organizador</h1>
      <p style={{ color: "#71717a", fontSize: 14, marginBottom: 24 }}>
        Organizadores podem criar parties de amigo secreto. Um admin precisa aprovar seu pedido antes.
      </p>

      {!user && (
        <button onClick={() => void signInWithGoogle()} style={{ padding: "10px 20px", borderRadius: 8 }}>
          Entrar com o Google pra continuar
        </button>
      )}

      {user && !done && (
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          style={{ padding: "10px 20px", borderRadius: 8 }}
        >
          {mutation.isPending ? "Enviando…" : `Solicitar como ${user.email}`}
        </button>
      )}

      {mutation.isError && <p style={{ color: "#991b1b", marginTop: 12 }}>{mutation.error.message}</p>}

      {done && (
        <p style={{ color: "#166534", marginTop: 12 }}>
          {done === "approved"
            ? "Você já é um organizador aprovado — recarregue a página."
            : "Pedido enviado! Avisaremos quando um admin aprovar."}
        </p>
      )}
    </main>
  );
}
