import { useRef } from "react";
import { useParams } from "react-router-dom";
import { Stack } from "@/shared/components/ui";
import { ParticipantLayout, ParticipantLoadState } from "./ParticipantLayout";
import { ParticipantStepNav } from "./ParticipantStepNav";
import { PreferenceCategoriesForm } from "./PreferenceCategoriesForm";
import type { SaveHandle } from "./SaveHandle";
import { useMyPartyView } from "./useMyPartyView";

export function ParticipantPreferencesPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const { data, isLoading, isError, error } = useMyPartyView(partyId);
  const formRef = useRef<SaveHandle>(null);

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
        <PreferenceCategoriesForm
          ref={formRef}
          partyId={partyId}
          categories={data.party.categories}
          preferredCategories={data.me.preferredCategories}
        />
        <ParticipantStepNav
          partyId={partyId}
          currentKey="preferences"
          me={data.me}
          beforeNext={() => formRef.current?.saveIfDirty() ?? Promise.resolve()}
        />
      </Stack>
    </ParticipantLayout>
  );
}
