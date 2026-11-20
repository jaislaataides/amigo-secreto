import { useParams } from "react-router-dom";
import { Stack } from "@/shared/components/ui";
import { ParticipantLayout, ParticipantLoadState } from "./ParticipantLayout";
import { ParticipantStepNav } from "./ParticipantStepNav";
import { PreferenceCategoriesForm } from "./PreferenceCategoriesForm";
import { useMyPartyView } from "./useMyPartyView";

export function ParticipantPreferencesPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const { data, isLoading, isError, error } = useMyPartyView(partyId);

  if (!partyId) return null;
  if (isLoading || isError || !data) return <ParticipantLoadState isLoading={isLoading} error={error} />;

  return (
    <ParticipantLayout partyId={partyId} name={data.party.name} imageUrl={data.party.imageUrl} isOwner={data.me.isOwner}>
      <Stack gap={20}>
        <PreferenceCategoriesForm
          partyId={partyId}
          categories={data.party.categories}
          preferredCategories={data.me.preferredCategories}
        />
        <ParticipantStepNav partyId={partyId} currentKey="preferences" me={data.me} />
      </Stack>
    </ParticipantLayout>
  );
}
