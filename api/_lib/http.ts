import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ApiError, sendApiError } from "./auth";

/**
 * Envolve o handler de uma rota com tratamento de erro consistente: um
 * ApiError vira a resposta JSON esperada; qualquer outro erro vira 500
 * genérico (e vai pro log da Vercel, nunca pro client).
 */
export function withErrorHandling(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<void>,
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    try {
      await handler(req, res);
    } catch (err) {
      sendApiError(res, err);
    }
  };
}

export function readJsonBody<T>(req: VercelRequest): T {
  // A Vercel já faz parse automático de JSON em req.body quando o
  // Content-Type é application/json.
  if (req.body === undefined || req.body === null) {
    throw new ApiError(400, "invalid-body", "Corpo da requisição ausente ou inválido.");
  }
  return req.body as T;
}

export function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(400, "invalid-body", `Campo obrigatório: ${field}.`);
  }
  return value.trim();
}

/** Lê o segmento dinâmico `[id]` de uma rota `api/parties/[id]/...`. */
export function requireQueryParam(req: VercelRequest, name: string): string {
  const value = req.query[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new ApiError(400, "invalid-param", `Parâmetro de rota ausente: ${name}.`);
  }
  return value;
}
