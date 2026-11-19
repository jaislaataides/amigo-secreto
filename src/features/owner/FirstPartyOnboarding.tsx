import { Steps, type Step } from "@/shared/components/Steps";
import { ButtonLink } from "@/shared/components/ui";

const ORGANIZER_STEPS: Step[] = [
  { icon: "sliders", title: "Crie a party", text: "Valor do presente, categorias e a lista de micos." },
  { icon: "mail", title: "Convide o grupo", text: "Cada pessoa recebe o convite por e-mail e confirma presença." },
  { icon: "gift", title: "Sorteie", text: "Cada um recebe um link só seu com o papelzinho de quem tirou." },
];

/** Estado vazio de quem ainda não organizou nada: explica e tem um único botão de criar. */
export function FirstPartyOnboarding() {
  return (
    <section className="onboarding">
      <div>
        <h2 className="section-title" style={{ marginBottom: 4 }}>
          Seu primeiro amigo secreto
        </h2>
        <p className="muted">Em três passos, sem planilha e sem papelzinho perdido.</p>
      </div>
      <Steps steps={ORGANIZER_STEPS} />
      <div>
        <ButtonLink to="/owner/parties/new" icon="plus" size="lg">
          Criar minha primeira party
        </ButtonLink>
      </div>
    </section>
  );
}
