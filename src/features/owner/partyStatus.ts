import type { BadgeTone } from "@/shared/components/ui";

export const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  collecting: "Coletando confirmações",
  ready_to_draw: "Pronta pra sortear",
  drawn: "Sorteada",
  canceled: "Cancelada",
};

export const STATUS_TONE: Record<string, BadgeTone> = {
  draft: "neutral",
  collecting: "warning",
  ready_to_draw: "brand",
  drawn: "success",
  canceled: "neutral",
};

export const PARTY_BACK = { to: "/owner", label: "Minhas parties" };
