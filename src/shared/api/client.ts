import { auth } from "@/shared/firebase/client";
import { accessCodeHeaderFor } from "./accessCode";

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function authHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

async function parseErrorBody(res: Response): Promise<{ code: string; message: string }> {
  try {
    const body = (await res.json()) as { error?: { code?: string; message?: string } };
    return {
      code: body.error?.code ?? "unknown",
      message: body.error?.message ?? "Algo deu errado. Tente novamente.",
    };
  } catch {
    return { code: "unknown", message: "Algo deu errado. Tente novamente." };
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...(await authHeader()),
    // Rotas do participante também precisam do código do link do e-mail.
    ...accessCodeHeaderFor(path),
    ...(init?.headers ?? {}),
  };

  const res = await fetch(path, { ...init, headers });

  if (!res.ok) {
    const { code, message } = await parseErrorBody(res);
    throw new ApiClientError(res.status, code, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
