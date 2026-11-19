import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth } from "./firebaseAdmin.js";

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Verifica o header `Authorization: Bearer <idToken>` com o Admin SDK.
 * Lança ApiError(401) se o header estiver ausente ou o token for inválido.
 */
export async function verifyAuth(req: VercelRequest): Promise<DecodedIdToken> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new ApiError(401, "unauthenticated", "Faça login para continuar.");
  }

  const idToken = header.slice("Bearer ".length).trim();
  try {
    return await adminAuth.verifyIdToken(idToken);
  } catch {
    throw new ApiError(401, "unauthenticated", "Sessão inválida ou expirada.");
  }
}

/**
 * E-mail da conta logada, normalizado — mas só se o provedor o VERIFICOU.
 * Toda identidade de participante/owner é resolvida por e-mail, então um
 * e-mail não verificado (ex: se algum dia o login por e-mail e senha for
 * ativado no Firebase) deixaria qualquer um se passar por outra pessoa e
 * responder no lugar dela. O login Google sempre vem verificado.
 */
export function requireVerifiedEmail(decoded: DecodedIdToken): string {
  if (!decoded.email) {
    throw new ApiError(400, "no-email", "Sua conta não tem e-mail.");
  }
  if (decoded.email_verified !== true) {
    throw new ApiError(403, "email-not-verified", "Seu e-mail ainda não foi verificado. Entre com a conta Google.");
  }
  return normalizeEmail(decoded.email);
}

export function requireAdmin(decoded: DecodedIdToken): void {
  if (decoded.admin !== true) {
    throw new ApiError(403, "forbidden", "Ação restrita a administradores.");
  }
}

/** Admin tem acesso a tudo que um owner tem — organizar parties incluso. */
export function requireOwner(decoded: DecodedIdToken): void {
  if (decoded.owner !== true && decoded.admin !== true) {
    throw new ApiError(403, "forbidden", "Ação restrita a organizadores aprovados.");
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Verifica o segredo de cron da Vercel (`Authorization: Bearer <CRON_SECRET>`). */
export function verifyCronSecret(req: VercelRequest): void {
  const header = req.headers.authorization;
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    throw new ApiError(500, "misconfigured", "CRON_SECRET não configurado.");
  }
  if (header !== `Bearer ${expected}`) {
    throw new ApiError(401, "unauthenticated", "Credencial de cron inválida.");
  }
}

/** Converte um ApiError (ou erro genérico) numa resposta JSON consistente. */
export function sendApiError(res: VercelResponse, err: unknown): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
    return;
  }
  console.error(err);
  res.status(500).json({
    error: { code: "internal", message: "Erro interno. Tente novamente." },
  });
}

/** Garante que o método HTTP da requisição é um dos permitidos. */
export function requireMethod(
  req: VercelRequest,
  res: VercelResponse,
  methods: string[],
): boolean {
  if (!req.method || !methods.includes(req.method)) {
    res.setHeader("Allow", methods.join(", "));
    res.status(405).json({ error: { code: "method-not-allowed", message: "Método não suportado." } });
    return false;
  }
  return true;
}
