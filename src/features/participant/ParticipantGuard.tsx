import type { ReactNode } from "react";
import { useAuth } from "@/auth/AuthContext";
import { AppSplash } from "@/auth/AppSplash";
import { GoogleSignInButton } from "@/auth/GoogleSignInButton";
import { Icon } from "@/shared/components/Icon";
import { AppLayout } from "@/app/AppLayout";

/**
 * Quem chega pelo link do convite muitas vezes não está logado ainda — em
 * vez de mandar pra "/" e perder o convite de vista (como o AuthGuard faz),
 * a autenticação acontece na própria página (mesmo padrão do RevealPage).
 * Quem já está logado (com a conta certa) passa direto, sem pedir login
 * de novo.
 */
export function ParticipantGuard(props: { children: ReactNode }) {
  const { user, loading, unauthorized } = useAuth();

  if (loading) return <AppSplash label="Carregando…" />;

  if (!user) {
    return (
      <main className="center-screen">
        <div className="reveal reveal--closed">
          <div className="reveal__gift reveal__gift--wiggle">
            <Icon name="lock" size={44} strokeWidth={1.75} />
          </div>
          <p className="reveal__eyebrow">Convite de amigo secreto</p>
          <h1 className="reveal__title">Entra pra continuar</h1>
          <p className="reveal__hint">Use a conta Google do e-mail em que você recebeu o convite.</p>
          <div style={{ width: "100%", maxWidth: 360, display: "grid", gap: 12 }}>
            {unauthorized && (
              <p className="reveal__hint" style={{ margin: 0 }}>
                Essa conta não participa de nenhuma party. Use a conta do e-mail que recebeu o convite.
              </p>
            )}
            <GoogleSignInButton label="Entrar com o Google" />
          </div>
        </div>
      </main>
    );
  }

  return <AppLayout>{props.children}</AppLayout>;
}
