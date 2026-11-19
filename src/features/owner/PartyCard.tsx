import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { GeneratedCover } from "@/shared/components/GeneratedCover";
import { Badge } from "@/shared/components/ui";
import { STATUS_LABEL, STATUS_TONE } from "./partyStatus";

export interface PartyRow {
  id: string;
  name: string;
  status: string;
  imageUrl: string | null;
}

/** Lista de parties do organizador (admin vê todas). Compartilhada entre a home e "Minhas parties". */
export function useOwnerParties() {
  return useQuery({
    queryKey: ["owner", "parties"],
    queryFn: () => api.get<{ parties: PartyRow[] }>("/api/parties"),
  });
}

export function PartyCard(props: { party: PartyRow }) {
  const { party } = props;
  return (
    <Link to={`/owner/parties/${party.id}/participants`} className="card card--flush card--interactive">
      {party.imageUrl ? (
        <img src={party.imageUrl} alt="" className="party-card__cover" loading="lazy" />
      ) : (
        <GeneratedCover seed={party.id} className="party-card__cover" />
      )}
      <div className="party-card__body">
        <span className="party-card__name">{party.name}</span>
        <Badge tone={STATUS_TONE[party.status] ?? "neutral"}>{STATUS_LABEL[party.status] ?? party.status}</Badge>
      </div>
    </Link>
  );
}
