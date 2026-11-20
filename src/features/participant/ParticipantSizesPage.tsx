import { useParams } from "react-router-dom";
import { Stack } from "@/shared/components/ui";
import { ParticipantLayout, ParticipantLoadState } from "./ParticipantLayout";
import { ParticipantStepNav } from "./ParticipantStepNav";
import { SizesForm } from "./SizesForm";
import { useMyPartyView } from "./useMyPartyView";

export function ParticipantSizesPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const { data, isLoading, isError, error } = useMyPartyView(partyId);

  if (!partyId) return null;
  if (isLoading || isError || !data) return <ParticipantLoadState isLoading={isLoading} error={error} />;

  return (
    <ParticipantLayout partyId={partyId} name={data.party.name} imageUrl={data.party.imageUrl} isOwner={data.me.isOwner}>
      <Stack gap={20}>
        <SizesForm partyId={partyId} rsvp={data.me.rsvp} sizes={data.me.sizes} />
        <ParticipantStepNav partyId={partyId} currentKey="sizes" me={data.me} />
      </Stack>
    </ParticipantLayout>
  );
}
