import { EmptyState } from "@/shared/components/Feedback";
import { ButtonLink } from "@/shared/components/ui";

export function NotFoundPage() {
  return (
    <main className="center-screen">
      <div style={{ width: "100%", maxWidth: 440 }}>
        <EmptyState
          icon="gift"
          title="Página não encontrada"
          action={<ButtonLink to="/">Voltar ao início</ButtonLink>}
        >
          Esse endereço não existe — talvez o link tenha sido copiado pela metade.
        </EmptyState>
      </div>
    </main>
  );
}
