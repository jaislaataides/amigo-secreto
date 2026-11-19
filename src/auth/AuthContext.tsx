import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { auth, googleProvider } from "@/shared/firebase/client";
import { api, ApiClientError } from "@/shared/api/client";

interface Role {
  admin: boolean;
  owner: boolean;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  role: Role;
  /** true logo após um deslogamento forçado por falta de vínculo com o sistema. */
  unauthorized: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const NO_ROLE: Role = { admin: false, owner: false };

// O Google Sign-In em si não tem como ser bloqueado de antemão no plano
// gratuito do Firebase (isso exigiria Blocking Functions, só disponíveis no
// plano pago Blaze). Essa página é a única exceção ao deslogamento forçado
// abaixo, porque é justamente onde alguém sem vínculo nenhum ainda consegue
// se cadastrar como candidato a owner pela primeira vez.
const ACCESS_REQUEST_PATH = "/solicitar-acesso";

export function AuthProvider(props: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(NO_ROLE);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (nextUser) => {
      if (!nextUser) {
        setUser(null);
        setRole(NO_ROLE);
        setLoading(false);
        return;
      }

      // Logo após o login a conta ainda está sendo validada (sync-role);
      // sem isso a tela de login ficava parada até a home aparecer de repente.
      setLoading(true);

      try {
        // Garante que os custom claims (admin/owner) estão atualizados no
        // Firestore antes de ler o token — necessário logo após aprovação
        // de um pedido de owner, por exemplo.
        const result = await api.post<{ admin: boolean; owner: boolean; hasAccess: boolean }>(
          "/api/auth/sync-role",
        );

        if (!result.hasAccess && window.location.pathname !== ACCESS_REQUEST_PATH) {
          await signOut(auth);
          setUser(null);
          setRole(NO_ROLE);
          setUnauthorized(true);
          return;
        }

        const tokenResult = await nextUser.getIdTokenResult(true);
        setUser(nextUser);
        setRole({
          admin: tokenResult.claims.admin === true,
          owner: tokenResult.claims.owner === true,
        });
        setUnauthorized(false);
      } catch (err) {
        // E-mail não verificado: o servidor não aceita essa conta como
        // ninguém (ver requireVerifiedEmail na API). Desloga em vez de
        // deixar uma sessão que não consegue fazer nada.
        if (err instanceof ApiClientError && err.code === "email-not-verified") {
          await signOut(auth);
          setUser(null);
          setRole(NO_ROLE);
          setUnauthorized(true);
          return;
        }
        // sync-role falhou (erro de rede/servidor) — não sabemos se a conta
        // tem acesso ou não, então não deslogamos ninguém às cegas. Em vez
        // de simplesmente zerar o papel, lê os claims que já estão no token
        // atual (podem já estar corretos de uma sincronização anterior).
        try {
          const tokenResult = await nextUser.getIdTokenResult(true);
          setUser(nextUser);
          setRole({
            admin: tokenResult.claims.admin === true,
            owner: tokenResult.claims.owner === true,
          });
        } catch {
          setUser(nextUser);
          setRole(NO_ROLE);
        }
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      role,
      unauthorized,
      signInWithGoogle: async () => {
        setUnauthorized(false);
        await signInWithPopup(auth, googleProvider);
      },
      signOutUser: async () => {
        await signOut(auth);
      },
    }),
    [user, loading, role, unauthorized],
  );

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
