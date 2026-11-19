import { Icon } from "@/shared/components/Icon";
import { Wordmark } from "@/shared/components/ui";

/** Lado esquerdo das telas de entrada: marca, promessa e o que o app resolve. */
export function BrandPanel() {
  return (
    <section className="brand-panel" aria-label="Sobre o Amico Secreto">
      <Wordmark />
      <h2 className="brand-panel__headline">
        O amigo secreto em que ninguém <em>paga mico.</em>
      </h2>
      <ul className="brand-panel__list">
        <li>
          <Icon name="check" size={18} strokeWidth={2.5} />
          <span>
            <strong>Sorteio sem spoiler.</strong> Cada pessoa vê só quem tirou, num link pessoal.
          </span>
        </li>
        <li>
          <Icon name="check" size={18} strokeWidth={2.5} />
          <span>
            <strong>Lista de micos.</strong> O grupo combina o que ninguém quer ganhar.
          </span>
        </li>
        <li>
          <Icon name="check" size={18} strokeWidth={2.5} />
          <span>
            <strong>Pistas de presente.</strong> Categorias e links de quem você tirou.
          </span>
        </li>
      </ul>
    </section>
  );
}
