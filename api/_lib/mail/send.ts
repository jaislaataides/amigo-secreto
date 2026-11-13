import { FieldValue, type DocumentReference } from "firebase-admin/firestore";
import { adminDb } from "../firebaseAdmin";
import { getMailFrom, getResendClient } from "./resendClient";
import { renderMailTemplate } from "./templates";
import type { MailTemplate } from "../../../shared/types";

export interface MailInput {
  template: MailTemplate;
  to: string;
  partyId: string;
  participantId?: string;
  payload: Record<string, unknown>;
}

async function deliver(ref: DocumentReference, input: MailInput): Promise<void> {
  try {
    const { subject, html } = await renderMailTemplate(input.template, input.payload);
    await getResendClient().emails.send({ from: getMailFrom(), to: input.to, subject, html });
    await ref.update({ status: "sent", sentAt: FieldValue.serverTimestamp() });
  } catch (err) {
    await ref.update({
      status: "failed",
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Grava o item em `mail` (outbox, pra auditoria/retry) e tenta entregar na
 * hora — e-mails como convite e link de revelação são sensíveis a tempo, e
 * o cron diário de retry (`/api/cron/process-mail`) existe só pra reprocessar
 * o que falhar aqui, não como caminho principal de envio.
 */
export async function enqueueAndSend(input: MailInput): Promise<void> {
  const ref = adminDb.collection("mail").doc();
  await ref.set({
    ...input,
    status: "queued",
    attempts: 1,
    createdAt: FieldValue.serverTimestamp(),
  });
  await deliver(ref, input);
}

/** Reenvia um item específico da fila (usado pelo cron de retry). */
export async function redeliver(ref: DocumentReference, input: MailInput): Promise<void> {
  await ref.update({ attempts: FieldValue.increment(1) });
  await deliver(ref, input);
}
