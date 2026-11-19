import nodemailer, { type Transporter } from "nodemailer";

let transport: Transporter | null = null;

export function getMailTransport(): Transporter {
  if (!transport) {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_APP_PASSWORD;
    if (!user || !pass) {
      throw new Error("Missing SMTP_USER or SMTP_APP_PASSWORD environment variable");
    }
    transport = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
    });
  }
  return transport;
}

export function getMailFrom(): string {
  return process.env.MAIL_FROM ?? `Amico Secreto <${process.env.SMTP_USER ?? ""}>`;
}
