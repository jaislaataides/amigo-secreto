/**
 * Liga a tela de entrada (AppSplash) à transição pro app (cortina no
 * AppLayout). A cortina só toca se o AppLayout montar logo depois da tela
 * de entrada sair — não a cada troca de página (cada rota monta o AppLayout
 * de novo), nem minutos depois numa tela sem cabeçalho (ex: revelação).
 */
const WINDOW_MS = 800;
let splashEndedAt = -Infinity;

export function markSplashEnded() {
  splashEndedAt = performance.now();
}

export function cameFromSplash(): boolean {
  return performance.now() - splashEndedAt < WINDOW_MS;
}
