import { Resend } from "resend";

let client: Resend | null = null;

export function getResendClient(): Resend {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("Missing RESEND_API_KEY environment variable");
    }
    client = new Resend(apiKey);
  }
  return client;
}

export function getMailFrom(): string {
  return process.env.MAIL_FROM ?? "Amigo Secreto <onboarding@resend.dev>";
}
