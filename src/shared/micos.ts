/**
 * A "lista de micos" (itens que ninguém quer ganhar) continua salva como
 * texto separado por vírgula em `forbiddenItemsText` — esses helpers só
 * convertem entre o texto e a lista de itens usada na interface.
 */
export function parseMicos(text: string | null | undefined): string[] {
  const seen = new Set<string>();
  const items: string[] = [];
  for (const raw of (text ?? "").split(/[,;\n]/)) {
    const item = raw.trim();
    const key = item.toLocaleLowerCase("pt-BR");
    if (item && !seen.has(key)) {
      seen.add(key);
      items.push(item);
    }
  }
  return items;
}

export function joinMicos(items: string[]): string {
  return items.join(", ");
}
