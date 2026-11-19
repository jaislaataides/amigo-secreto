import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, ApiClientError } from "@/shared/api/client";
import { Badge, Button, Stack } from "@/shared/components/ui";
import { EmptyState, FullPageSpinner } from "@/shared/components/Feedback";
import { Icon } from "@/shared/components/Icon";
import { LinkPreview } from "@/shared/components/LinkPreview";
import { useAuth } from "@/auth/AuthContext";
import { AppSplash } from "@/auth/AppSplash";
import { GoogleSignInButton } from "@/auth/GoogleSignInButton";

interface RevealResult {
  receiverName: string;
  receiverCategories: string[];
  referenceLinks: {
    id: string;
    url: string;
    title: string | null;
    imageUrl: string | null;
    description: string | null;
  }[];
}

export function RevealPage() {
  const { partyId, participantId } = useParams<{ partyId: string; participantId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("t");
  // O nome só aparece depois de um toque — evita spoiler pra quem estiver
  // olhando a tela junto, e dá um momento de "abrir o presente".
  const [opened, setOpened] = useState(false);
  const { user, loading: authLoading, unauthorized } = useAuth();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["reveal", partyId, participantId, token],
    queryFn: () => api.post<RevealResult>("/api/reveal", { partyId, participantId, token }),
    enabled: Boolean(partyId && participantId && token && user),
    retry: false,
  });

  if (!token) {
    return (
      <RevealError message="Esse link está incompleto — falta o código de acesso. Abra o link exatamente como veio no e-mail." />
    );
  }

  if (authLoading) return <AppSplash label="Carregando…" />;

  // Normalmente quem clica no link do e-mail não está logado: entra aqui
  // mesmo e o papelzinho abre na sequência, sem trocar de tela.
  if (!user) return <RevealSignIn unauthorized={unauthorized} />;

  if (isLoading) return <FullPageSpinner />;

  if (isError || !data) {
    const message = error instanceof ApiClientError ? error.message : "Não foi possível revelar o resultado.";
    return <RevealError message={message} />;
  }

  if (!opened) {
    return (
      <main className="reveal-screen">
        <div className="reveal reveal--closed">
          <div className="reveal__gift reveal__gift--wiggle">
            <Icon name="gift" size={48} strokeWidth={1.75} />
          </div>
          <p className="reveal__eyebrow">O sorteio saiu</p>
          <h1 className="reveal__title">Seu amigo secreto está aqui dentro</h1>
          <p className="reveal__hint">Pra não pagar mico: confira se ninguém está espiando sua tela.</p>
          <Button size="lg" icon="gift" onClick={() => setOpened(true)}>
            Abrir presente
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="reveal-screen">
      <div className="reveal">
        <div className="slip slip--paper slip--unfold">
          <p className="slip__eyebrow">Você tirou</p>
          <h1 className="reveal__name" aria-live="polite">
            {data.receiverName}
          </h1>
        </div>
        {data.receiverCategories.length > 0 && (
          <div className="enter" style={{ animationDelay: "200ms" }}>
            <p className="reveal__eyebrow" style={{ marginBottom: 10 }}>
              Curte ganhar
            </p>
            <div className="reveal__chips">
              {data.receiverCategories.map((c) => (
                <Badge key={c}>{c}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="reveal__body enter" style={{ animationDelay: "300ms" }}>
        <div className="reveal__body-inner">
          <h2 className="section-title">Ideias de presente</h2>
          {data.referenceLinks.length === 0 ? (
            <EmptyState icon="link">
              {data.receiverName} ainda não adicionou nenhuma referência. Vale usar as categorias como pista!
            </EmptyState>
          ) : (
            <Stack gap={10}>
              {data.referenceLinks.map((link) => (
                <LinkPreview key={link.id} {...link} />
              ))}
            </Stack>
          )}

          <p className="hint" style={{ marginTop: 32, display: "flex", gap: 6, alignItems: "flex-start" }}>
            <Icon name="lock" size={16} />
            Só você vê isso. Disponível por 15 dias após o sorteio.
          </p>
        </div>
      </div>
    </main>
  );
}

function RevealError(props: { message: string }) {
  return (
    <main className="center-screen">
      <div style={{ width: "100%", maxWidth: 460 }}>
        <EmptyState icon="alert" title="Não deu pra abrir">
          {props.message}
        </EmptyState>
      </div>
    </main>
  );
}

/** Tela fechada da revelação pra quem chegou pelo link sem estar logado. */
function RevealSignIn(props: { unauthorized: boolean }) {
  return (
    <main className="reveal-screen">
      <div className="reveal reveal--closed">
        <div className="reveal__gift reveal__gift--wiggle">
          <Icon name="lock" size={44} strokeWidth={1.75} />
        </div>
        <p className="reveal__eyebrow">O sorteio saiu</p>
        <h1 className="reveal__title">Seu papelzinho está guardado</h1>
        <p className="reveal__hint">
          Pra abrir, entre com a conta Google do e-mail em que você recebeu este link. Só você consegue ver.
        </p>
        <div style={{ width: "100%", maxWidth: 360, display: "grid", gap: 12 }}>
          {props.unauthorized && (
            <p className="reveal__hint" style={{ margin: 0 }}>
              Essa conta não participa de nenhuma party. Use a conta do e-mail que recebeu o link.
            </p>
          )}
          <GoogleSignInButton label="Entrar com o Google pra abrir" />
        </div>
      </div>
    </main>
  );
}
