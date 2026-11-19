import { EmptyState } from "@/shared/components/Feedback";
import { ButtonLink } from "@/shared/components/ui";

export function NotFoundPage() {
  return (
    <main className="center-screen">
      <div style={{ width: "100%", maxWidth: 440 }}>
        <EmptyState
          title="Ops, esse mico foi nosso"
          action={<ButtonLink to="/">Voltar ao início</ButtonLink>}
        >
          Essa página não existe. Talvez o link tenha sido copiado pela metade.
        </EmptyState>
      </div>
    </main>
  );
}
