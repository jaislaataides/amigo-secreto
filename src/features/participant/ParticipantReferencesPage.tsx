import { useParams } from "react-router-dom";
import { Stack } from "@/shared/components/ui";
import { ParticipantLayout, ParticipantLoadState } from "./ParticipantLayout";
import { ParticipantStepNav } from "./ParticipantStepNav";
import { ReferenceLinksForm } from "./ReferenceLinksForm";
import { useMyPartyView } from "./useMyPartyView";

export function ParticipantReferencesPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const { data, isLoading, isError, error } = useMyPartyView(partyId);

  if (!partyId) return null;
  if (isLoading || isError || !data) return <ParticipantLoadState isLoading={isLoading} error={error} />;

  return (
    <ParticipantLayout
      partyId={partyId}
      name={data.party.name}
      imageUrl={data.party.imageUrl}
      isOwner={data.me.isOwner}
      partyStatus={data.party.status}
    >
      <Stack gap={20}>
        <ReferenceLinksForm partyId={partyId} links={data.me.referenceLinks} />
        <ParticipantStepNav partyId={partyId} currentKey="references" me={data.me} />
      </Stack>
    </ParticipantLayout>
  );
}
