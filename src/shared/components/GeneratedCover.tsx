import type { CSSProperties } from "react";
import { MonkeyMark } from "./MonkeyMark";

/**
 * Capa gerada pra party sem foto: formas roxas/verdes sobre o roxo da
 * marca, sempre as mesmas pra mesma party (semente = id), e o macaquinho
 * espiando no canto. Ajuda a reconhecer cada party de relance.
 */
export function GeneratedCover(props: { seed: string; className?: string; ratio?: number }) {
  // Desenha já na proporção de onde vai ser exibida, pra o macaquinho
  // nunca ser cortado pelo enquadramento.
  const H = 180;
  const W = Math.round(H * (props.ratio ?? 16 / 9));
  const rand = mulberry32(hash(props.seed));
  const shapes: JSX.Element[] = [];
  const cols = Math.round(W / 40);
  const rows = 5;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (rand() < 0.42) continue; // deixa respiro
      const x = c * 42 + 12 + rand() * 18;
      const y = r * 38 + 10 + rand() * 16;
      const size = 7 + rand() * 13;
      const fill = PALETTE[Math.floor(rand() * PALETTE.length)];
      const kind = Math.floor(rand() * 4);
      const rot = Math.floor(rand() * 90);
      const key = `${r}-${c}`;
      if (kind === 0) shapes.push(<circle key={key} cx={x} cy={y} r={size / 2} style={fill} />);
      else if (kind === 1)
        shapes.push(
          <rect
            key={key}
            x={x - size / 2}
            y={y - size / 2}
            width={size}
            height={size}
            rx={2}
            transform={`rotate(${rot} ${x} ${y})`}
            style={fill}
          />,
        );
      else if (kind === 2) {
        const h = size * 0.9;
        shapes.push(
          <path
            key={key}
            d={`M${x} ${y - h / 2} L${x + h / 2} ${y + h / 2} L${x - h / 2} ${y + h / 2}Z`}
            transform={`rotate(${rot} ${x} ${y})`}
            style={fill}
          />,
        );
      } else
        shapes.push(
          <circle
            key={key}
            cx={x}
            cy={y}
            r={size / 2}
            style={{ ...fill, fill: "none", stroke: fill.fill, strokeWidth: 2.5 }}
          />,
        );
    }
  }

  return (
    <svg
      className={props.className}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-hidden="true"
      focusable="false"
      style={{ background: "var(--color-brand)", display: "block" }}
    >
      {shapes}
      {/* Macaquinho espiando pela borda de baixo. */}
      <MonkeyMark
        size={74}
        x={W - 92}
        y={H - 58}
        style={{ color: "var(--color-primary)", ["--mark-face" as string]: "var(--color-brand)" } as CSSProperties}
      />
    </svg>
  );
}

const PALETTE: { fill: string; opacity?: number }[] = [
  { fill: "var(--color-brand-raised)" },
  { fill: "var(--color-brand-raised)" },
  { fill: "var(--color-on-brand-muted)", opacity: 0.35 },
  { fill: "var(--color-primary)", opacity: 0.9 },
  { fill: "var(--color-primary)", opacity: 0.45 },
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
