import type { ReactNode } from "react";
import { Badge, Card, Page, PageHeader } from "@/shared/components/ui";
import { ErrorBanner, FullPageSpinner } from "@/shared/components/Feedback";
import { parseMicos } from "@/shared/micos";
import { ParticipantTabs } from "./ParticipantTabs";
import type { MyPartyView } from "./useMyPartyView";

const RSVP_LABEL = { pending: "Ainda não respondeu", going: "Confirmado", not_going: "Não vai" } as const;
const RSVP_TONE = { pending: "warning", going: "success", not_going: "neutral" } as const;

/**
 * Moldura das telas do participante: título, abas e, ao lado, um resumo
 * fixo da party (valor, lista de micos, sua resposta).
 */
export function ParticipantLayout(props: {
  partyId: string;
  view: MyPartyView;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  const { party, me } = props.view;
  const micos = parseMicos(party.forbiddenItemsText);

  return (
    <Page maxWidth={1040}>
      <PageHeader title={party.name} subtitle={props.subtitle} />
      <div className="with-aside with-aside--aside-first">
        <div>
          <ParticipantTabs partyId={props.partyId} />
          {props.children}
        </div>

        <aside>
          <Card flush>
            {party.imageUrl && <img src={party.imageUrl} alt="" className="party-cover" />}
            <dl className="facts" style={{ padding: 20 }}>
              <dt>Valor</dt>
              <dd>
                R$ {party.valueRange.min} a R$ {party.valueRange.max}
              </dd>
              <dt>Você</dt>
              <dd>
                <Badge tone={RSVP_TONE[me.rsvp]}>{RSVP_LABEL[me.rsvp]}</Badge>
              </dd>
              {micos.length > 0 && (
                <>
                  <dt>Micos</dt>
                  <dd>
                    <span className="row" style={{ gap: 6 }}>
                      {micos.map((m) => (
                        <Badge key={m}>{m}</Badge>
                      ))}
                    </span>
                  </dd>
                </>
              )}
            </dl>
          </Card>
        </aside>
      </div>
    </Page>
  );
}

export function ParticipantLoadState(props: { isLoading: boolean; error: Error | null }) {
  if (props.isLoading) return <FullPageSpinner />;
  return (
    <Page>
      <ErrorBanner message={props.error?.message ?? "Não foi possível carregar a party."} />
    </Page>
  );
}
