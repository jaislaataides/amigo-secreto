import { useEffect } from "react";
import { markSplashEnded } from "@/app/entryCue";
import { MonkeyMark } from "@/shared/components/MonkeyMark";

/**
 * Tela de entrada da marca, enquanto a sessão é conferida (ao abrir o app
 * ou logo depois do login com o Google). Ao sair, o AppLayout recolhe a
 * mesma cor roxa até virar o cabeçalho.
 */
export function AppSplash(props: { label?: string }) {
  // Marca o momento em que a tela sai; o AppLayout que montar em seguida
  // faz a cortina.
  useEffect(() => markSplashEnded, []);

  return (
    <div className="splash" role="status">
      <span className="splash__mark">
        <MonkeyMark size={44} />
      </span>
      <span className="splash__label">{props.label ?? "Entrando…"}</span>
    </div>
  );
}
