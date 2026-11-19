import { useRef } from "react";

/**
 * Mantém o calendário nativo do navegador (bom de usar, acessível), mas
 * nunca mostra o texto cru do <input type="date">, que o navegador formata
 * conforme a localidade do sistema (muitas vezes mm/dd/aaaa mesmo com o
 * app em português). O <input> real fica invisível só pra guardar o valor
 * e abrir o seletor nativo; o que aparece pro usuário é sempre dd/mm/aaaa.
 */
export function DateInputBR(props: { value: string; onChange: (next: string) => void }) {
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

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={openPicker}
        style={{
          padding: "8px 36px 8px 12px",
          borderRadius: 8,
          border: "1px solid #d4d4d8",
          fontSize: 14,
          background: "none",
          color: props.value ? "inherit" : "#71717a",
          cursor: "pointer",
          textAlign: "left",
          width: 160,
        }}
      >
        {formatBR(props.value) || "dd/mm/aaaa"}
        <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
          📅
        </span>
      </button>
      <input
        ref={inputRef}
        type="date"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
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
