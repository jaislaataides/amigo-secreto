import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "@/shared/components/Icon";
import { MonkeyMark } from "@/shared/components/MonkeyMark";
import { BrandName } from "@/shared/components/BrandName";
import { ButtonLink } from "@/shared/components/ui";

interface ShowcaseStep {
  step: number;
  title: string;
  body: string;
  /** Arquivo em public/landing/ — ver nota no fim do componente. */
  screenshot: string;
  alt: string;
}

const STEPS: ShowcaseStep[] = [
  {
    step: 1,
    title: "Crie sua party",
    body: "Defina o valor do presente, as categorias de presente e o prazo de confirmação. Leva menos de um minuto.",
    screenshot: "/landing/step-create.png",
    alt: "Tela de criação de uma party no Amico Secreto, com nome, valor do presente e categorias selecionáveis.",
  },
  {
    step: 2,
    title: "Convide a galera",
    body: "Cada pessoa recebe um e-mail com um link pessoal pra confirmar presença e deixar referências de presente.",
    screenshot: "/landing/step-invite.png",
    alt: "Lista de participantes de uma party, cada um com o status de confirmação.",
  },
  {
    step: 3,
    title: "Receba seu resultado",
    body: "No dia do sorteio, o link de quem você tirou chega só pro seu e-mail — ninguém mais, nem o organizador, consegue abrir.",
    screenshot: "/landing/step-reveal.png",
    alt: "Tela de revelação do amigo secreto mostrando o nome de quem a pessoa tirou.",
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
      </header>

      <section className="landing-hero">
        <div className="landing-hero__inner">
          <h1 className="landing-hero__title">
            Amigo secreto <em>sem pagar mico.</em>
          </h1>
          <p className="landing-hero__subtitle">
            Organize o sorteio do seu grupo com confirmação por e-mail, resultado privado pra cada pessoa e uma lista
            do que ninguém quer ganhar.
          </p>
          <ButtonLink to="/login" size="lg">
            Entrar
          </ButtonLink>
          <Link to="/solicitar-acesso" className="landing-hero__secondary">
            Quero organizar uma party
          </Link>
        </div>
      </section>

      <section className="landing-section">
        <h2 className="landing-section__title">Como funciona</h2>
        <div className="landing-showcase">
          {STEPS.map((s) => (
            <div key={s.step} className={`landing-showcase__row ${s.step % 2 === 0 ? "is-reversed" : ""}`}>
              <div className="landing-showcase__frame">
                <div className="landing-showcase__chrome">
                  <span />
                  <span />
                  <span />
                </div>
                <Screenshot src={s.screenshot} alt={s.alt} />
              </div>
              <div className="landing-showcase__text">
                <span className="landing-showcase__step">Passo {s.step}</span>
                <h3 className="landing-showcase__title">{s.title}</h3>
                <p className="landing-showcase__body">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-trust">
        <div className="landing-trust__inner">
          <span className="landing-trust__icon">
            <Icon name="shield" size={28} />
          </span>
          <h2 className="landing-trust__title">Ninguém vê o resultado dos outros</h2>
          <p className="landing-trust__body">
            O sorteio é criptografado ponta a ponta. Só quem abre o próprio link, com a própria conta Google, consegue
            ver quem tirou — isso vale até pra quem organiza a party.
          </p>
          <ul className="landing-trust__list">
            <li>
              <Icon name="lock" size={16} /> Sorteio sem spoiler, nem pro organizador
            </li>
            <li>
              <Icon name="link" size={16} /> Referências e categorias pra não chutar no escuro
            </li>
            <li>
              <Icon name="ban" size={16} /> Lista de micos: o que ninguém quer ganhar
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}

/**
 * Print real da tela, se existir em public/landing/<nome>.png (1280px de
 * largura é uma boa referência). Até lá, cai num quadro vazio no estilo da
 * marca em vez do ícone de imagem quebrada do navegador.
 */
function Screenshot(props: { src: string; alt: string }) {
  const [missing, setMissing] = useState(false);

  if (missing) {
    return (
      <div className="landing-showcase__placeholder">
        <Icon name="image" size={28} />
        Print em breve
      </div>
    );
  }

  return (
    <img
      src={props.src}
      alt={props.alt}
      className="landing-showcase__img"
      loading="lazy"
      onError={() => setMissing(true)}
    />
  );
}
