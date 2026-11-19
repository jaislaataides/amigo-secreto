import type { VercelRequest, VercelResponse } from "@vercel/node";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { wrapDek, generatePartyDek } from "../../_lib/crypto/envelope.js";
import { validateImageDataUrl } from "../../_lib/image.js";
import { adminDb } from "../../_lib/firebaseAdmin.js";
import { ApiError, normalizeEmail, requireMethod, requireOwner, verifyAuth } from "../../_lib/auth.js";
import { readJsonBody, requireString, withErrorHandling } from "../../_lib/http.js";
import type { Party } from "../../../shared/types.js";

const DEFAULT_MAX_PARTICIPANTS = 10;

interface CreatePartyBody {
  name: string;
  description?: string;
  valueMin: number;
  valueMax: number;
  forbiddenItemsText?: string;
  rsvpDeadline: string; // ISO date string
  customCategories?: string[];
  imageDataUrl?: string;
}

export const createParty = withErrorHandling(async (req: VercelRequest, res: VercelResponse) => {
  if (!requireMethod(req, res, ["POST"])) return;

  const decoded = await verifyAuth(req);
  requireOwner(decoded);
  if (!decoded.email) {
    throw new ApiError(400, "no-email", "Sua conta Google não tem e-mail.");
  }

  const body = readJsonBody<CreatePartyBody>(req);
  const name = requireString(body.name, "name");

  if (typeof body.valueMin !== "number" || typeof body.valueMax !== "number" || body.valueMin > body.valueMax) {
    throw new ApiError(400, "invalid-body", "valueMin/valueMax inválidos.");
  }

  const rsvpDeadlineDate = new Date(requireString(body.rsvpDeadline, "rsvpDeadline"));
  if (Number.isNaN(rsvpDeadlineDate.getTime()) || rsvpDeadlineDate.getTime() <= Date.now()) {
    throw new ApiError(400, "invalid-body", "rsvpDeadline deve ser uma data futura válida.");
  }

  const partyRef = adminDb.collection("parties").doc();
  const now = FieldValue.serverTimestamp();

  const party: Omit<Party, "createdAt" | "updatedAt" | "rsvpDeadline"> & {
    createdAt: FieldValue;
    updatedAt: FieldValue;
    rsvpDeadline: Timestamp;
  } = {
    name,
    description: body.description?.trim() ?? "",
    imageUrl: body.imageDataUrl ? validateImageDataUrl(body.imageDataUrl) : null,
    ownerUid: decoded.uid,
    ownerEmail: normalizeEmail(decoded.email),
    status: "draft",
    valueRange: { min: body.valueMin, max: body.valueMax, currency: "BRL" },
    forbiddenItemsText: body.forbiddenItemsText?.trim() ?? "",
    maxParticipants: DEFAULT_MAX_PARTICIPANTS,
    rsvpDeadline: Timestamp.fromDate(rsvpDeadlineDate),
    createdAt: now,
    updatedAt: now,
  };

  const batch = adminDb.batch();
  batch.set(partyRef, party);

  // Copia as categorias base da plataforma pra dentro da party (cada party
  // é independente a partir daqui — editar platformCategories não afeta
  // parties já criadas).
  const platformCategories = await adminDb
    .collection("platformCategories")
    .where("active", "==", true)
    .get();
  for (const doc of platformCategories.docs) {
    const data = doc.data();
    batch.set(partyRef.collection("categories").doc(doc.id), {
      label: data.label,
      isCustom: false,
      createdAt: now,
    });
  }

  for (const label of body.customCategories ?? []) {
    const trimmed = label.trim();
    if (!trimmed) continue;
    batch.set(partyRef.collection("categories").doc(), {
      label: trimmed,
      isCustom: true,
      createdAt: now,
    });
  }

  // Gera e embrulha a DEK desta party (envelope encryption) — nunca em claro.
  const dek = generatePartyDek();
  const wrapped = wrapDek(dek);
  batch.set(partyRef.collection("dekMeta").doc("current"), {
    ...wrapped,
    createdAt: now,
  });

  // O owner também participa do amigo secreto por padrão (conta como um dos
  // maxParticipants) — ele pode se remover depois via DELETE .../participants/:pid
  // se preferir só organizar. Como ele mesmo está logado agora, já sabemos o
  // uid na hora (diferente de um participante convidado comum).
  const ownerDisplayName = decoded.name?.trim() || decoded.email!.split("@")[0]!;
  batch.set(partyRef.collection("participants").doc(), {
    name: ownerDisplayName,
    email: normalizeEmail(decoded.email),
    uid: decoded.uid,
    inviteStatus: "sent",
    isOwner: true,
    rsvp: "pending",
    preferredCategories: [],
    createdAt: now,
    updatedAt: now,
  });

  await batch.commit();

  res.status(201).json({ partyId: partyRef.id });
});
