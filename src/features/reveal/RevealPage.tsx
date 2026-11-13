import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api, ApiClientError } from "@/shared/api/client";
import { Badge, Card, Page } from "@/shared/components/ui";
import { ErrorBanner, FullPageSpinner } from "@/shared/components/Feedback";

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

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["reveal", partyId, participantId, token],
    queryFn: () => api.post<RevealResult>("/api/reveal", { partyId, participantId, token }),
    enabled: Boolean(partyId && participantId && token),
    retry: false,
  });

  if (!token) {
    return (
      <Page maxWidth={480}>
        <ErrorBanner message="Link inválido — falta o token de acesso. Use o link exatamente como veio no e-mail." />
      </Page>
    );
  }

  if (isLoading) return <FullPageSpinner />;

  if (isError) {
    const message = error instanceof ApiClientError ? error.message : "Não foi possível revelar o resultado.";
    return (
      <Page maxWidth={480}>
        <ErrorBanner message={message} />
      </Page>
    );
  }

  return (
    <Page maxWidth={480}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <p style={{ color: "#71717a", fontSize: 14 }}>Você tirou</p>
        <h1 style={{ fontSize: 32, margin: "4px 0" }}>🎁 {data!.receiverName}</h1>
      </div>

      {data!.receiverCategories.length > 0 && (
        <div style={{ textAlign: "center", marginBottom: 24, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          {data!.receiverCategories.map((c) => (
            <Badge key={c}>{c}</Badge>
          ))}
        </div>
      )}

      <h2 style={{ fontSize: 16 }}>Referências de presente</h2>
      {data!.referenceLinks.length === 0 && (
        <p style={{ color: "#71717a", fontSize: 14 }}>Essa pessoa ainda não adicionou nenhuma referência.</p>
      )}
      {data!.referenceLinks.map((link) => (
        <Card key={link.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {link.imageUrl && (
            <img src={link.imageUrl} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 8 }} />
          )}
          <div style={{ minWidth: 0 }}>
            <a href={link.url} target="_blank" rel="noreferrer" style={{ fontWeight: 600, fontSize: 14 }}>
              {link.title || link.url}
            </a>
            {link.description && <p style={{ color: "#71717a", fontSize: 13, margin: "4px 0 0" }}>{link.description}</p>}
          </div>
        </Card>
      ))}

      <p style={{ color: "#a1a1aa", fontSize: 12, textAlign: "center", marginTop: 32 }}>
        Este resultado fica disponível por 15 dias após o sorteio.
      </p>
    </Page>
  );
}
