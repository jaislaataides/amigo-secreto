import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, ApiClientError } from "@/shared/api/client";
import { Badge } from "@/shared/components/ui";
import { EmptyState, FullPageSpinner } from "@/shared/components/Feedback";
import { LinkPreview } from "@/shared/components/LinkPreview";

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

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["reveal", partyId, participantId, token],
    queryFn: () => api.post<RevealResult>("/api/reveal", { partyId, participantId, token }),
    enabled: Boolean(partyId && participantId && token),
    retry: false,
  });

  if (!token) {
    return (
      <RevealError message="Esse link está incompleto: falta o código de acesso. Abra o link exatamente como veio no e-mail." />
    );
  }

  if (isLoading) return <FullPageSpinner />;

  if (isError || !data) {
    const message = error instanceof ApiClientError ? error.message : "Não foi possível revelar o resultado.";
    return <RevealError message={message} />;
  }

  if (!opened) {
    return (
      <main className="reveal-screen">
        <div className="reveal reveal--closed">
          <p className="reveal__hint">O sorteio saiu. Pra não pagar mico, confira se ninguém está espiando sua tela.</p>
          <button type="button" className="slip slip--folded slip--button" onClick={() => setOpened(true)}>
            <span className="slip__label">Seu papelzinho</span>
            <span className="slip__cta">Toque pra abrir</span>
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="reveal-screen">
      <div className="reveal">
        <article className="slip slip--open" aria-live="polite">
          <div className="slip__top">
            <p className="slip__label">Você tirou</p>
            <h1 className="slip__name">
              <span className="mark">{data.receiverName}</span>
            </h1>
          </div>
          {data.receiverCategories.length > 0 && (
            <div className="slip__bottom">
              <p className="slip__label">Curte ganhar</p>
              <div className="reveal__chips">
                {data.receiverCategories.map((c) => (
                  <Badge key={c}>{c}</Badge>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>

      <div className="reveal__body">
        <div className="reveal__body-inner enter" style={{ animationDelay: "380ms" }}>
          <h2 className="section-title">Ideias de presente</h2>
          {data.referenceLinks.length === 0 ? (
            <EmptyState>
              {data.receiverName} ainda não adicionou nenhuma referência. Use as categorias como pista.
            </EmptyState>
          ) : (
            <ul className="rows card card--flush">
              {data.referenceLinks.map((link) => (
                <li key={link.id}>
                  <LinkPreview {...link} />
                </li>
              ))}
            </ul>
          )}

          <p className="hint" style={{ marginTop: 24 }}>
            Só você vê isso. O link fica disponível por 15 dias após o sorteio.
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
        <EmptyState title="Não deu pra abrir">
          {props.message}
        </EmptyState>
      </div>
    </main>
  );
}
