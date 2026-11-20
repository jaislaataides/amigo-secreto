import { useParams } from "react-router-dom";
import { Stack } from "@/shared/components/ui";
import { useMyPartyView } from "@/features/participant/useMyPartyView";
import { PreferenceCategoriesForm } from "@/features/participant/PreferenceCategoriesForm";
import { ReferenceLinksForm } from "@/features/participant/ReferenceLinksForm";
import { SizesForm } from "@/features/participant/SizesForm";
import { PartyLayout, PartyLoadState } from "./PartyLayout";

/**
 * Categorias/referências/medidas do organizador — ele também participa da
 * própria party, mas não confirma presença nem navega pelas abas de quem só
 * participa (ver PartyTabs: essa aba só aparece pra quem criou a party).
 */
export function PartyCreatorGiftPage() {
  const { partyId } = useParams<{ partyId: string }>();
  const { data, isLoading, isError, error } = useMyPartyView(partyId);

  if (!partyId) return null;
  if (isLoading || isError || !data) return <PartyLoadState isLoading={isLoading} error={error} />;

  return (
    <PartyLayout
      partyId={partyId}
      name={data.party.name}
      status={data.party.status}
      subtitle="Suas preferências como participante da própria party."
    >
      <Stack gap={32}>
        <PreferenceCategoriesForm
          partyId={partyId}
          categories={data.party.categories}
          preferredCategories={data.me.preferredCategories}
        />
        <ReferenceLinksForm partyId={partyId} links={data.me.referenceLinks} />
        <SizesForm partyId={partyId} rsvp={data.me.rsvp} sizes={data.me.sizes} />
      </Stack>
    </PartyLayout>
  );
}
