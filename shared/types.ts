// Tipos de domínio compartilhados entre o front-end (src/) e as API routes
// (api/). Arquivo só com tipos (sem runtime), importado via caminho
// relativo dos dois lados para não depender de alias de bundler.

export type PartyStatus =
  | "draft"
  | "collecting"
  | "ready_to_draw"
  | "drawn"
  | "canceled";

export type Rsvp = "pending" | "going" | "not_going";

export type InviteStatus = "pending" | "sent" | "failed";

export interface ValueRange {
  min: number;
  max: number;
  currency: "BRL";
}

export interface Party {
  name: string;
  description: string;
  /**
   * Data URI (ex: "data:image/jpeg;base64,...") de um thumbnail pequeno da
   * capa, guardado direto no documento — sem Firebase Storage, que passou a
   * exigir o plano pago Blaze mesmo para uso gratuito. Limitado a ~700KB
   * (ver MAX_IMAGE_DATA_URL_BYTES) pra caber com folga no limite de 1MiB por
   * documento do Firestore.
   */
  imageUrl: string | null;
  ownerUid: string;
  ownerEmail: string;
  status: PartyStatus;
  valueRange: ValueRange;
  forbiddenItemsText: string;
  maxParticipants: number;
  rsvpDeadline: FirestoreTimestampLike;
  createdAt: FirestoreTimestampLike;
  updatedAt: FirestoreTimestampLike;
  drawnAt?: FirestoreTimestampLike | null;
  purgeAt?: FirestoreTimestampLike | null;
}

export interface Category {
  label: string;
  isCustom: boolean;
  createdAt: FirestoreTimestampLike;
}

export interface Participant {
  name: string;
  email: string;
  uid: string | null;
  inviteStatus: InviteStatus;
  rsvp: Rsvp;
  rsvpAt?: FirestoreTimestampLike | null;
  preferredCategories: string[];
  createdAt: FirestoreTimestampLike;
  updatedAt: FirestoreTimestampLike;
  /**
   * O owner também participa do amigo secreto por padrão: ao criar a party,
   * um participante com isOwner:true é criado automaticamente pra ele,
   * contando para o maxParticipants como qualquer outro. Ele pode se
   * remover da lista (DELETE .../participants/:pid) se quiser só organizar.
   */
  isOwner?: boolean;
}

export interface ReferenceLink {
  url: string;
  title: string | null;
  imageUrl: string | null;
  description: string | null;
  domain: string | null;
  fetchedAt: FirestoreTimestampLike;
  fetchStatus: "ok" | "failed";
}

export type ExclusionType = "pair" | "group";

export interface Exclusion {
  type: ExclusionType;
  participantIds: string[];
  createdAt: FirestoreTimestampLike;
}

export interface EncryptedAssignment {
  giverParticipantId: string;
  ciphertext: string;
  iv: string;
  authTag: string;
  dekVersion: number;
  createdAt: FirestoreTimestampLike;
  revealCount: number;
}

export interface PossessionToken {
  tokenHash: string;
  /** Pra remontar o link de revelação no reenvio de e-mail (ver crypto/linkTokens.ts). */
  nonce?: string;
  createdAt: FirestoreTimestampLike;
  usedCount: number;
  lastUsedAt?: FirestoreTimestampLike | null;
}

export interface DekMeta {
  wrappedDekB64: string;
  iv: string;
  authTag: string;
  kekVersion: number;
  createdAt: FirestoreTimestampLike;
}

export type MailTemplate =
  | "invite"
  | "reminder"
  | "rsvp_ack"
  | "reveal_link"
  | "draw_done_owner"
  | "draw_infeasible_owner";

export type MailStatus = "queued" | "sent" | "failed";

export interface MailItem {
  template: MailTemplate;
  to: string;
  partyId: string;
  participantId?: string;
  payload: Record<string, unknown>;
  status: MailStatus;
  attempts: number;
  createdAt: FirestoreTimestampLike;
  sentAt?: FirestoreTimestampLike | null;
  error?: string | null;
}

export type OwnerStatus = "pending" | "approved" | "rejected";

export interface AuthorizedOwner {
  email: string;
  status: OwnerStatus;
  requestedAt: FirestoreTimestampLike;
  requestedName?: string | null;
  approvedBy?: string | null;
  approvedAt?: FirestoreTimestampLike | null;
  uid?: string | null;
}

export interface AdminDoc {
  email: string;
  displayName: string;
  createdAt: FirestoreTimestampLike;
}

export interface PlatformCategory {
  label: string;
  order: number;
  active: boolean;
}

// Mínimo denominador comum entre o Timestamp do client SDK e do Admin SDK,
// para este arquivo não depender de nenhum dos dois pacotes.
export interface FirestoreTimestampLike {
  toDate(): Date;
  toMillis(): number;
}
