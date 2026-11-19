import { useRef } from "react";
import { Icon } from "./Icon";

/**
 * Mantém o calendário nativo do navegador (bom de usar, acessível), mas
 * nunca mostra o texto cru do <input type="date">, que o navegador formata
 * conforme a localidade do sistema (muitas vezes mm/dd/aaaa mesmo com o
 * app em português). O <input> real fica invisível só pra guardar o valor
 * e abrir o seletor nativo; o que aparece pro usuário é sempre dd/mm/aaaa.
 */
export function DateInputBR(props: { id?: string; value: string; onChange: (next: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    const el = inputRef.current;
    if (!el) return;
    const withPicker = el as HTMLInputElement & { showPicker?: () => void };
    if (typeof withPicker.showPicker === "function") {
      try {
        withPicker.showPicker();
        return;
      } catch {
        // navegador recusou fora de um gesto direto do usuário — cai pro focus.
      }
    }
    el.focus();
  }

  const formatted = formatBR(props.value);

  return (
    <div className="date-input">
      <button
        id={props.id}
        type="button"
        onClick={openPicker}
        className={`date-input__button${formatted ? "" : " is-empty"}`}
      >
        {formatted || "dd/mm/aaaa"}
        <Icon name="calendar" size={18} />
      </button>
      <input
        ref={inputRef}
        type="date"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}

function formatBR(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return "";
  const [, y, m, d] = match;
  return `${d}/${m}/${y}`;
}
