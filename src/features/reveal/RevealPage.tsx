import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, ApiClientError } from "@/shared/api/client";
import { Badge, Button, Card, Page, Stack } from "@/shared/components/ui";
import { EmptyState, FullPageSpinner } from "@/shared/components/Feedback";
import { Icon } from "@/shared/components/Icon";
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
      <RevealError message="Esse link está incompleto — falta o código de acesso. Abra o link exatamente como veio no e-mail." />
    );
  }

  if (isLoading) return <FullPageSpinner />;

  if (isError || !data) {
    const message = error instanceof ApiClientError ? error.message : "Não foi possível revelar o resultado.";
    return <RevealError message={message} />;
  }

  if (!opened) {
    return (
      <main className="center-screen">
        <Card className="auth-card">
          <p className="reveal__eyebrow">O sorteio saiu</p>
          <h1 style={{ fontSize: 28, marginTop: 6 }}>Quem será que você tirou?</h1>
          <p className="reveal__hint">Confira se ninguém está espiando a sua tela antes de abrir.</p>
          <Button size="lg" icon="gift" block onClick={() => setOpened(true)}>
            Abrir meu papelzinho
          </Button>
        </Card>
      </main>
    );
  }

  return (
    <Page maxWidth={560}>
      <Card className="reveal">
        <p className="reveal__eyebrow">Você tirou</p>
        <h1 className="reveal__name" aria-live="polite">
          {data.receiverName}
        </h1>
        {data.receiverCategories.length > 0 && (
          <>
            <p className="hint" style={{ marginBottom: 8 }}>
              Curte presentes de
            </p>
            <div className="reveal__chips">
              {data.receiverCategories.map((c) => (
                <Badge key={c}>{c}</Badge>
              ))}
            </div>
          </>
        )}
      </Card>

      <section className="section">
        <h2 className="section-title">Ideias de presente</h2>
        {data.referenceLinks.length === 0 ? (
          <EmptyState icon="link">
            {data.receiverName} ainda não deixou referências. Use as categorias acima como pista — e fuja do mico.
          </EmptyState>
        ) : (
          <Stack gap={10}>
            {data.referenceLinks.map((link) => (
              <LinkPreview key={link.id} {...link} />
            ))}
          </Stack>
        )}
      </section>

      <p className="hint" style={{ textAlign: "center", marginTop: 40, display: "flex", gap: 6, justifyContent: "center" }}>
        <Icon name="lock" size={16} />
        Só você vê isso. Disponível por 15 dias após o sorteio.
      </p>
    </Page>
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
