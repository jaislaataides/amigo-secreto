import { ApiError } from "./auth.js";

// Firestore limita cada documento a 1MiB. Guardamos a imagem como data URI
// no próprio doc da party (sem Storage, que passou a exigir plano Blaze) —
// por isso o limite bem abaixo de 1MiB, com folga pros outros campos.
const MAX_IMAGE_DATA_URL_BYTES = 700_000;
const DATA_URL_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;

/** Valida um data URI de imagem antes de gravar no Firestore. */
export function validateImageDataUrl(value: unknown): string {
  if (typeof value !== "string" || !DATA_URL_PATTERN.test(value)) {
    throw new ApiError(
      400,
      "invalid-image",
      "Imagem inválida — precisa ser um JPEG, PNG ou WebP.",
    );
  }
  if (value.length > MAX_IMAGE_DATA_URL_BYTES) {
    throw new ApiError(
      400,
      "image-too-large",
      "Imagem grande demais. Tente uma foto menor/mais simples (o app já comprime antes de enviar, mas o limite é baixo porque a imagem fica guardada direto no banco de dados).",
    );
  }
  return value;
}
