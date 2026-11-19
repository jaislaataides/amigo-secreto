import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { GeneratedCover } from "@/shared/components/GeneratedCover";
import { Badge, type BadgeTone } from "@/shared/components/ui";
import { STATUS_LABEL, STATUS_TONE } from "./partyStatus";

export interface PartyRow {
  id: string;
  name: string;
  status: string;
  imageUrl: string | null;
}

export interface InvitedPartyRow extends PartyRow {
  ownerEmail: string;
  rsvp: "pending" | "going" | "not_going";
}

/** Parties criadas por quem está logado (admin incluso: só as dele). */
export function useOwnerParties(enabled = true) {
  return useQuery({
    queryKey: ["owner", "parties"],
    queryFn: () => api.get<{ parties: PartyRow[] }>("/api/parties?scope=mine"),
    enabled,
  });
}

/** Parties em que quem está logado foi convidado (fora as que organiza). */
export function useInvitedParties() {
  return useQuery({
    queryKey: ["participant", "invited"],
    queryFn: () => api.get<{ parties: InvitedPartyRow[] }>("/api/parties/invited"),
  });
}

function CardShell(props: { to: string; party: PartyRow; children: ReactNode }) {
  const { party } = props;
  return (
    <Link to={props.to} className="card card--flush card--interactive">
      {party.imageUrl ? (
        <img src={party.imageUrl} alt="" className="party-card__cover" loading="lazy" />
      ) : (
        <GeneratedCover seed={party.id} className="party-card__cover" />
      )}
      <div className="party-card__body">
        <span className="party-card__name">{party.name}</span>
        {props.children}
      </div>
    </Link>
  );
}

/** Party que você organiza: leva pra administração. */
export function PartyCard(props: { party: PartyRow }) {
  const { party } = props;
  return (
    <CardShell to={`/owner/parties/${party.id}/participants`} party={party}>
      <Badge tone={STATUS_TONE[party.status] ?? "neutral"}>{STATUS_LABEL[party.status] ?? party.status}</Badge>
    </CardShell>
  );
}

const RSVP_LABEL: Record<InvitedPartyRow["rsvp"], string> = {
  pending: "Pendente",
  going: "Confirmado",
  not_going: "Recusado",
};

const RSVP_TONE: Record<InvitedPartyRow["rsvp"], BadgeTone> = {
  pending: "warning",
  going: "success",
  not_going: "danger",
};

/** Party em que você foi convidado: leva pra sua confirmação. */
export function InvitedPartyCard(props: { party: InvitedPartyRow }) {
  const { party } = props;
  return (
    <CardShell to={`/p/${party.id}/rsvp`} party={party}>
      <span className="row" style={{ gap: 6 }}>
        <Badge tone={RSVP_TONE[party.rsvp]}>{RSVP_LABEL[party.rsvp]}</Badge>
        {party.status === "drawn" && <Badge>Sorteio feito</Badge>}
      </span>
      <span className="muted small">Organizado por {party.ownerEmail}</span>
    </CardShell>
  );
}
