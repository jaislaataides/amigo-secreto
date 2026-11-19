import type { ReactNode } from "react";
import { Icon } from "@/shared/components/Icon";

/** Login e pedido de acesso: painel de marca à esquerda (topo no celular), ação à direita. */
export function AuthShell(props: { children: ReactNode }) {
  return (
    <main className="auth">
      <section className="auth__brand">
        <span className="brand" aria-hidden="true">
          <span className="brand__mark">
            <Icon name="monkey" size={22} />
          </span>
          Amico Secreto
        </span>
        <p className="auth__headline">
          Amigo secreto <em>sem pagar mico.</em>
        </p>
        <ul className="auth__promises">
          <li>
            <strong>Sorteio sem spoiler.</strong> Cada um vê só quem tirou, num link pessoal.
          </li>
          <li>
            <strong>Pistas de presente.</strong> Categorias e links do que a pessoa quer ganhar.
          </li>
          <li>
            <strong>Lista de micos.</strong> O que ninguém quer ganhar fica combinado antes.
          </li>
        </ul>
      </section>
      <section className="auth__form">
        <div className="auth__panel">{props.children}</div>
      </section>
    </main>
  );
}
