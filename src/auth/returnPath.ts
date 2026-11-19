/**
 * Pra onde voltar depois do login (ex: link do convite aberto sem estar
 * logado). O AuthGuard também passa isso no state da navegação; aqui fica
 * uma cópia que sobrevive a recarregar a página durante o login.
 */
const KEY = "amico:returnTo";

export function rememberReturnPath(path: string) {
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    // sem armazenamento: fica só o state da navegação
  }
}

export function takeReturnPath(): string | null {
  try {
    const path = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    // Só caminhos internos, nunca um endereço de fora.
    return path && path.startsWith("/") && !path.startsWith("//") ? path : null;
  } catch {
    return null;
  }
}
