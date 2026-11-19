import { FieldValue, type DocumentReference } from "firebase-admin/firestore";
import { adminDb } from "../firebaseAdmin.js";
import { getMailFrom, getMailTransport } from "./mailTransport.js";
import { renderMailTemplate } from "./templates.js";
import { deriveLinkToken, type LinkPurpose } from "../crypto/linkTokens.js";
import { getAppBaseUrl } from "../env.js";
import type { MailTemplate } from "../../../shared/types.js";

export interface MailInput {
  template: MailTemplate;
  to: string;
  partyId: string;
  participantId?: string;
  payload: Record<string, unknown>;
}

/**
 * Link com código não é guardado na fila: o payload leva só
 * `link: { purpose, nonce }`, e o URL é remontado aqui, na hora de enviar
 * (inclusive nos reenvios do cron). Ver crypto/linkTokens.ts.
 */
export interface MailLink {
  purpose: LinkPurpose;
  nonce: string;
}

export function resolveMailLinks(input: MailInput): Record<string, unknown> {
  const link = input.payload.link as MailLink | undefined;
  if (!link || !input.participantId) return input.payload;
  const token = deriveLinkToken(link.purpose, input.partyId, input.participantId, link.nonce);
  const base = getAppBaseUrl();
  const { link: _link, ...rest } = input.payload;
  return link.purpose === "access"
    ? { ...rest, joinUrl: `${base}/p/${input.partyId}/rsvp?t=${token}` }
    : { ...rest, revealUrl: `${base}/reveal/${input.partyId}/${input.participantId}?t=${token}` };
}

async function deliver(ref: DocumentReference, input: MailInput): Promise<boolean> {
  try {
    const { subject, html } = await renderMailTemplate(input.template, resolveMailLinks(input));
    await getMailTransport().sendMail({ from: getMailFrom(), to: input.to, subject, html });
    await ref.update({ status: "sent", sentAt: FieldValue.serverTimestamp() });
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[mail] falha ao enviar para ${input.to} (template: ${input.template}): ${message}`);
    await ref.update({ status: "failed", error: message });
    return false;
  }
}

/**
 * Grava o item em `mail` (outbox, pra auditoria/retry) e tenta entregar na
 * hora — e-mails como convite e link de revelação são sensíveis a tempo, e
 * o cron diário de retry (`/api/cron/process-mail`) existe só pra reprocessar
 * o que falhar aqui, não como caminho principal de envio.
 */
/** Devolve se o e-mail saiu agora (falha fica na fila pro cron reenviar). */
export async function enqueueAndSend(input: MailInput): Promise<boolean> {
  const ref = adminDb.collection("mail").doc();
  await ref.set({
    ...input,
    status: "queued",
    attempts: 1,
    createdAt: FieldValue.serverTimestamp(),
  });
  return deliver(ref, input);
}

/** Reenvia um item específico da fila (usado pelo cron de retry). */
export async function redeliver(ref: DocumentReference, input: MailInput): Promise<boolean> {
  await ref.update({ attempts: FieldValue.increment(1) });
  return deliver(ref, input);
}
