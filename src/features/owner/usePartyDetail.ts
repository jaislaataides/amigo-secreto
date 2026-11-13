import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/client";

export interface PartyDetailCategory {
  id: string;
  label: string;
  isCustom: boolean;
}

export interface PartyDetailParticipant {
  id: string;
  name: string;
  email: string;
  rsvp: "pending" | "going" | "not_going";
  inviteStatus: "pending" | "sent" | "failed";
  isOwner?: boolean;
  preferredCategories: string[];
}

export interface PartyDetailExclusion {
  id: string;
  type: "pair" | "group";
  participantIds: string[];
}

export interface PartyDetail {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  status: string;
  valueRange: { min: number; max: number; currency: string };
  forbiddenItemsText: string;
  maxParticipants: number;
  rsvpDeadline: { _seconds: number; _nanoseconds: number } | string;
  categories: PartyDetailCategory[];
  participants: PartyDetailParticipant[];
  exclusions: PartyDetailExclusion[];
}

export function usePartyDetail(partyId: string | undefined) {
  return useQuery({
    queryKey: ["owner", "party", partyId],
    queryFn: () => api.get<PartyDetail>(`/api/parties/${partyId}`),
    enabled: Boolean(partyId),
  });
}
