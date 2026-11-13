import { useQuery } from "@tanstack/react-query";
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
  return useQuery({
    queryKey: ["participant", "me", partyId],
    queryFn: () => api.get<MyPartyView>(`/api/parties/${partyId}/me`),
    enabled: Boolean(partyId),
  });
}
