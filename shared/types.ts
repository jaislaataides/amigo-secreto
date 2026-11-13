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
  imageUrl: string | null;
  imageVersion: number;
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
