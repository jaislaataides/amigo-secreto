import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { saveAccessCode } from "@/shared/api/accessCode";
import { api } from "@/shared/api/client";

export interface MyPartyCategory {
  id: string;
  label: string;
  isCustom: boolean;
}

export interface MyReferenceLink {
  id: string;
  url: string;
  title: string | null;
  imageUrl: string | null;
  description: string | null;
  domain: string | null;
  fetchStatus: "ok" | "failed";
}

export interface MyPartyView {
  party: {
    id: string;
    name: string;
    description: string;
    imageUrl: string | null;
    valueRange: { min: number; max: number; currency: string };
    forbiddenItemsText: string;
    status: string;
    categories: MyPartyCategory[];
  };
  me: {
    id: string;
    name: string;
    email: string;
    rsvp: "pending" | "going" | "not_going";
    preferredCategories: string[];
    referenceLinks: MyReferenceLink[];
  };
}

export function useMyPartyView(partyId: string | undefined) {
  useCaptureAccessCode(partyId);
  return useQuery({
    queryKey: ["participant", "me", partyId],
    queryFn: () => api.get<MyPartyView>(`/api/parties/${partyId}/me`),
    enabled: Boolean(partyId),
  });
}

/**
 * Chegou pelo link do e-mail (`?t=...`): guarda o código antes da primeira
 * chamada à API e tira ele da barra de endereço (não fica no histórico nem
 * vaza em print/compartilhamento de URL).
 */
function useCaptureAccessCode(partyId: string | undefined) {
  const [params, setParams] = useSearchParams();
  const code = params.get("t");
  // Síncrono, de propósito: a query lê o código já no primeiro render.
  if (partyId && code) saveAccessCode(partyId, code);

  useEffect(() => {
    if (!code) return;
    const next = new URLSearchParams(params);
    next.delete("t");
    setParams(next, { replace: true });
  }, [code, params, setParams]);
}
