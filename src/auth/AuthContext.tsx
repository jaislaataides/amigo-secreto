import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { auth, googleProvider } from "@/shared/firebase/client";
import { api } from "@/shared/api/client";

interface Role {
  admin: boolean;
  owner: boolean;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  role: Role;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const NO_ROLE: Role = { admin: false, owner: false };

export function AuthProvider(props: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(NO_ROLE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);

      if (!nextUser) {
        setRole(NO_ROLE);
        setLoading(false);
        return;
      }

      try {
        // Garante que os custom claims (admin/owner) estão atualizados no
        // Firestore antes de ler o token — necessário logo após aprovação
        // de um pedido de owner, por exemplo.
        await api.post("/api/auth/sync-role");
        const tokenResult = await nextUser.getIdTokenResult(true);
        setRole({
          admin: tokenResult.claims.admin === true,
          owner: tokenResult.claims.owner === true,
        });
      } catch {
        setRole(NO_ROLE);
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
      signInWithGoogle: async () => {
        await signInWithPopup(auth, googleProvider);
      },
      signOutUser: async () => {
        await signOut(auth);
      },
    }),
    [user, loading, role],
  );

  return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
