import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import * as cheerio from "cheerio";

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024; // 2MB
const FETCH_TIMEOUT_MS = 5000;
const MAX_REDIRECTS = 5;
const USER_AGENT = "AmigoSecretoLinkPreviewBot/1.0 (+https://github.com/)";

export interface LinkPreview {
  title: string | null;
  imageUrl: string | null;
  description: string | null;
  domain: string | null;
}

export function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return true; // malformado -> bloqueia
  const [a, b] = parts as [number, number, number, number];
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true; // link-local
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  return false;
}

export function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  return (
    lower === "::1" ||
    lower === "::" ||
    lower.startsWith("fc") ||
    lower.startsWith("fd") ||
    lower.startsWith("fe80")
  );
}

/** Resolve o host e bloqueia loopback/privado/link-local — mitigação de SSRF. */
async function assertPublicHost(hostname: string): Promise<void> {
  const version = isIP(hostname);
  if (version === 4) {
    if (isPrivateIPv4(hostname)) throw new Error("Host privado/local bloqueado.");
    return;
  }
  if (version === 6) {
    if (isPrivateIPv6(hostname)) throw new Error("Host privado/local bloqueado.");
    return;
  }
  if (hostname === "localhost") throw new Error("Host privado/local bloqueado.");

  const { address, family } = await lookup(hostname);
  if (family === 4 && isPrivateIPv4(address)) throw new Error("Host privado/local bloqueado.");
  if (family === 6 && isPrivateIPv6(address)) throw new Error("Host privado/local bloqueado.");
}

function parseHttpUrl(raw: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error("URL inválida.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Só URLs http/https são permitidas.");
  }
  return parsed;
}

/**
 * Busca a URL seguindo redirects manualmente (revalidando o host a cada
 * salto) para não permitir SSRF via "a URL pública redireciona pra um IP
 * interno depois da checagem inicial".
 */
async function fetchFollowingRedirects(startUrl: URL): Promise<{ html: string; finalUrl: URL }> {
  let currentUrl = startUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicHost(currentUrl.hostname);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(currentUrl.toString(), {
        signal: controller.signal,
        redirect: "manual",
        headers: { "User-Agent": USER_AGENT },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Redirect sem Location.");
      currentUrl = new URL(location, currentUrl);
      continue;
    }

    if (!response.ok) {
      throw new Error(`Falha ao buscar a URL (status ${response.status}).`);
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_RESPONSE_BYTES) {
      throw new Error("Resposta grande demais.");
    }

    const html = await readBodyWithLimit(response);
    return { html, finalUrl: currentUrl };
  }

  throw new Error("Redirecionamentos demais.");
}

async function readBodyWithLimit(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return response.text();

  const decoder = new TextDecoder();
  let html = "";
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      throw new Error("Resposta grande demais.");
    }
    html += decoder.decode(value, { stream: true });
  }
  return html;
}

export async function fetchOpenGraphPreview(rawUrl: string): Promise<LinkPreview> {
  const parsed = parseHttpUrl(rawUrl);
  const { html, finalUrl } = await fetchFollowingRedirects(parsed);

  const $ = cheerio.load(html);
  const title = $('meta[property="og:title"]').attr("content") || $("title").first().text() || null;
  const imageUrlRaw = $('meta[property="og:image"]').attr("content") || null;
  const description =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    null;

  return {
    title: title?.trim() || null,
    imageUrl: imageUrlRaw ? new URL(imageUrlRaw, finalUrl).toString() : null,
    description: description?.trim() || null,
    domain: finalUrl.hostname,
  };
}
