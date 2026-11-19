/**
 * Mascote da marca em formas cheias (silhueta), pra ler bem em 24–28px.
 * Usa duas tintas: `currentColor` pra cabeça/orelhas/olhos e
 * `var(--mark-face)` pro rosto, que por padrão é a cor do fundo do selo.
 */
export function MonkeyMark(props: { size?: number }) {
  const size = props.size ?? 26;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <g fill="currentColor">
        <circle cx="4.4" cy="12.2" r="3.1" />
        <circle cx="19.6" cy="12.2" r="3.1" />
        <circle cx="12" cy="12" r="8.4" />
      </g>
      <g fill="var(--mark-face, var(--color-primary))">
        <circle cx="4.4" cy="12.2" r="1.4" />
        <circle cx="19.6" cy="12.2" r="1.4" />
        <circle cx="9.5" cy="11" r="3" />
        <circle cx="14.5" cy="11" r="3" />
        <ellipse cx="12" cy="15.3" rx="4.9" ry="3.7" />
      </g>
      <g fill="currentColor">
        <circle cx="9.7" cy="11.2" r="1.15" />
        <circle cx="14.3" cy="11.2" r="1.15" />
      </g>
      <path
        d="M10.1 15.6q1.9 1.5 3.8 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
