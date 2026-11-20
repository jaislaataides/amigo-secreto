import { Link } from "react-router-dom";
import { Icon, type IconName } from "@/shared/components/Icon";
import { MonkeyMark } from "@/shared/components/MonkeyMark";
import { BrandName } from "@/shared/components/BrandName";
import { ButtonLink } from "@/shared/components/ui";

const STEPS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "gift",
    title: "Crie a party",
    body: "Defina o valor do presente, as categorias e o prazo de confirmação. Leva menos de um minuto.",
  },
  {
    icon: "mail",
    title: "Convide a galera",
    body: "Cada pessoa recebe um e-mail com um link pessoal pra confirmar presença e deixar referências de presente.",
  },
  {
    icon: "lock",
    title: "Receba seu resultado",
    body: "No dia do sorteio, o link de quem você tirou chega só pro seu e-mail — ninguém mais consegue abrir.",
  },
];

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "lock",
    title: "Sorteio sem spoiler",
    body: "Cada participante só vê quem tirou — nem o organizador consegue espiar o resultado dos outros.",
  },
  {
    icon: "link",
    title: "Ideias de presente",
    body: "Quem você tirou pode deixar links de referência e categorias favoritas, pra ninguém chutar no escuro.",
  },
  {
    icon: "ban",
    title: "Lista de micos",
    body: "Defina o que ninguém quer ganhar — a lista aparece pra todo mundo da party antes de comprar qualquer coisa.",
  },
];

export function LandingPage() {
  return (
    <main>
      <header className="landing-header">
        <Link to="/" className="brand">
          <span className="brand__mark">
            <MonkeyMark />
          </span>
          <BrandName />
        </Link>
        <ButtonLink to="/login" variant="secondary" size="sm">
          Entrar
        </ButtonLink>
      </header>

      <section className="landing-hero">
        <div className="landing-hero__inner">
          <h1 className="landing-hero__title">
            Amigo secreto <em>sem pagar mico.</em>
          </h1>
          <p className="landing-hero__subtitle">
            Organize o amigo secreto do seu grupo com sorteio automático, resultado só pra cada pessoa e um jeito
            fácil de não ganhar presente ruim.
          </p>
          <div className="landing-hero__actions">
            <ButtonLink to="/login" size="lg" icon="sparkles">
              Entrar com o Google
            </ButtonLink>
            <ButtonLink to="/solicitar-acesso" variant="secondary" size="lg">
              Quero organizar uma party
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <h2 className="landing-section__title">Como funciona</h2>
        <div className="landing-steps">
          {STEPS.map((step, i) => (
            <div key={step.title} className="landing-card">
              <span className="landing-card__icon">
                <Icon name={step.icon} size={22} />
              </span>
              <span className="landing-card__step">Passo {i + 1}</span>
              <h3 className="landing-card__title">{step.title}</h3>
              <p className="landing-card__body">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <h2 className="landing-section__title">Por que usar</h2>
        <div className="landing-features">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="landing-card">
              <span className="landing-card__icon">
                <Icon name={feature.icon} size={22} />
              </span>
              <h3 className="landing-card__title">{feature.title}</h3>
              <p className="landing-card__body">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-footer-cta">
        <div className="landing-footer-cta__inner">
          <h2 className="landing-section__title" style={{ marginBottom: 0 }}>
            Bora organizar o seu?
          </h2>
          <ButtonLink to="/login" size="lg" icon="sparkles">
            Entrar com o Google
          </ButtonLink>
        </div>
      </section>
    </main>
  );
}
