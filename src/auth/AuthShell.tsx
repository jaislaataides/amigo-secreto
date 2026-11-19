import type { ReactNode } from "react";
import { Icon } from "@/shared/components/Icon";
import { MonkeyMark } from "@/shared/components/MonkeyMark";

/** Login e pedido de acesso: painel de marca à esquerda (topo no celular), ação à direita. */
export function AuthShell(props: { children: ReactNode }) {
  return (
    <main className="auth">
      <section className="auth__brand">
        <span className="brand" aria-hidden="true">
          <span className="brand__mark">
            <MonkeyMark />
          </span>
          <span>
            A<em className="brand__mico">mico</em> Secreto
          </span>
        </span>
        <p className="auth__headline">
          Amigo secreto <em>sem pagar mico.</em>
        </p>
        <ul className="auth__promises">
          <li>
            <Icon name="lock" size={18} /> Sorteio sem spoiler: cada um vê só quem tirou.
          </li>
          <li>
            <Icon name="link" size={18} /> Ideias e referências de quem você tirou.
          </li>
          <li>
            <Icon name="ban" size={18} /> Lista de micos: o que ninguém quer ganhar.
          </li>
        </ul>
      </section>
      <section className="auth__form">
        <div className="auth__panel">{props.children}</div>
      </section>
    </main>
  );
}
