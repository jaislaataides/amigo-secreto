import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui";
import { participantSteps, type ParticipantStepKey } from "./ParticipantTabs";

/**
 * Botão de avançar pra próxima etapa, ao fim de cada página de participante.
 * Se a página atual tiver rascunho não salvo (categorias/medidas), passa
 * `beforeNext` pra salvar antes de navegar — senão a escolha some em
 * silêncio ao clicar em "Próximo" sem ter clicado em "Salvar" antes.
 */
export function ParticipantStepNav(props: {
  partyId: string;
  currentKey: ParticipantStepKey;
  me: { isOwner: boolean; rsvp: string };
  beforeNext?: () => Promise<void>;
}) {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const steps = participantSteps(props.partyId, props.me);
  const currentIndex = steps.findIndex((s) => s.key === props.currentKey);
  const next = steps[currentIndex + 1];
  const target = next ? next.to : props.me.isOwner ? `/owner/parties/${props.partyId}/participants` : "/home";
  const label = next ? `Próximo: ${next.label}` : "Concluir";

  async function handleClick() {
    if (props.beforeNext) {
      setSaving(true);
      try {
        await props.beforeNext();
      } finally {
        setSaving(false);
      }
    }
    navigate(target);
  }

  return (
    <div className="form-actions" style={{ justifyContent: "flex-end" }}>
      <Button icon={next ? "arrowRight" : "check"} loading={saving} onClick={() => void handleClick()}>
        {saving ? "Salvando…" : label}
      </Button>
    </div>
  );
}
