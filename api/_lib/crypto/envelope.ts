import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  createHash,
  hkdfSync,
  timingSafeEqual,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12;
const KEY_LENGTH_BYTES = 32;

interface SealedPayload {
  ivB64: string;
  authTagB64: string;
  ciphertextB64: string;
}

/**
 * Lê a chave mestra (KEK) da variável de ambiente da Vercel. Nunca existe em
 * disco nem no Firestore — só nesta variável, lida em runtime de servidor.
 */
function getMasterKek(): Buffer {
  const base64 = process.env.MASTER_KEK_BASE64;
  if (!base64) {
    throw new Error("Missing MASTER_KEK_BASE64 environment variable");
  }
  const key = Buffer.from(base64, "base64");
  if (key.length !== KEY_LENGTH_BYTES) {
    throw new Error(
      `MASTER_KEK_BASE64 must decode to ${KEY_LENGTH_BYTES} bytes, got ${key.length}`,
    );
  }
  return key;
}

/**
 * Subchave derivada da KEK (HKDF-SHA256) pra um uso específico. Separa os
 * papéis: a mesma KEK nunca é usada direto pra assinar links e pra cifrar.
 */
export function deriveSubkey(info: string): Buffer {
  return Buffer.from(hkdfSync("sha256", getMasterKek(), Buffer.alloc(0), info, KEY_LENGTH_BYTES));
}

function seal(key: Buffer, plaintext: Buffer, aad?: Buffer): SealedPayload {
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  if (aad) cipher.setAAD(aad);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    ivB64: iv.toString("base64"),
    authTagB64: authTag.toString("base64"),
    ciphertextB64: ciphertext.toString("base64"),
  };
}

function unseal(key: Buffer, payload: SealedPayload, aad?: Buffer): Buffer {
  const iv = Buffer.from(payload.ivB64, "base64");
  const authTag = Buffer.from(payload.authTagB64, "base64");
  const ciphertext = Buffer.from(payload.ciphertextB64, "base64");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  if (aad) decipher.setAAD(aad);
  // Lança se a authTag/AAD não bater — AEAD garante integridade, não só sigilo.
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

// --- DEK (Data Encryption Key) por party ---

export interface WrappedDek {
  wrappedDekB64: string;
  iv: string;
  authTag: string;
  kekVersion: number;
}

/** Gera uma nova DEK de 256 bits para uma party. Nunca persistida sem wrap. */
export function generatePartyDek(): Buffer {
  return randomBytes(KEY_LENGTH_BYTES);
}

/** Envolve (wrap) a DEK com a KEK mestra — o que é persistido no Firestore. */
export function wrapDek(dek: Buffer): WrappedDek {
  const sealed = seal(getMasterKek(), dek);
  return {
    wrappedDekB64: sealed.ciphertextB64,
    iv: sealed.ivB64,
    authTag: sealed.authTagB64,
    kekVersion: 1,
  };
}

/** Desembrulha a DEK com a KEK mestra. Lança se os dados foram adulterados. */
export function unwrapDek(meta: WrappedDek): Buffer {
  return unseal(getMasterKek(), {
    ciphertextB64: meta.wrappedDekB64,
    ivB64: meta.iv,
    authTagB64: meta.authTag,
  });
}

// --- Criptografia do assignment (quem cada giver tirou) ---

export interface EncryptedAssignmentPayload {
  ciphertext: string;
  iv: string;
  authTag: string;
}

/**
 * O AAD amarra o ciphertext a este party+giver específico — trocar o
 * ciphertext de um assignment por outro (mesmo que ambos usem a mesma DEK)
 * faz a descriptografia falhar.
 */
function buildAssignmentAad(partyId: string, giverParticipantId: string): Buffer {
  return Buffer.from(`${partyId}:${giverParticipantId}`, "utf8");
}

export function encryptAssignment(
  dek: Buffer,
  partyId: string,
  giverParticipantId: string,
  receiverParticipantId: string,
): EncryptedAssignmentPayload {
  const sealed = seal(
    dek,
    Buffer.from(receiverParticipantId, "utf8"),
    buildAssignmentAad(partyId, giverParticipantId),
  );
  return {
    ciphertext: sealed.ciphertextB64,
    iv: sealed.ivB64,
    authTag: sealed.authTagB64,
  };
}

/** Retorna o `receiverParticipantId` em claro. Lança se adulterado/trocado. */
export function decryptAssignment(
  dek: Buffer,
  partyId: string,
  giverParticipantId: string,
  payload: EncryptedAssignmentPayload,
): string {
  const plaintext = unseal(
    dek,
    {
      ciphertextB64: payload.ciphertext,
      ivB64: payload.iv,
      authTagB64: payload.authTag,
    },
    buildAssignmentAad(partyId, giverParticipantId),
  );
  return plaintext.toString("utf8");
}

// --- Token de posse (link de revelação) ---

/** 256 bits de entropia, codificados para uso direto em URL. */
export function generatePossessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashPossessionToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** Comparação em tempo constante — nunca usar `===` para comparar hashes de token. */
export function verifyPossessionToken(token: string, storedHash: string): boolean {
  const computed = Buffer.from(hashPossessionToken(token), "hex");
  const stored = Buffer.from(storedHash, "hex");
  if (computed.length !== stored.length) {
    return false;
  }
  return timingSafeEqual(computed, stored);
}
