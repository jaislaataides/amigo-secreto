import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import { Button, CheckOption } from "@/shared/components/ui";
import { Alert, ErrorBanner } from "@/shared/components/Feedback";
import type { MyPartyCategory } from "./useMyPartyView";

/** Categorias favoritas — usado pela página de participante e pela do organizador (ver PartyCreatorGiftPage). */
export function PreferenceCategoriesForm(props: {
  partyId: string;
  categories: MyPartyCategory[];
  preferredCategories: string[];
}) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>(props.preferredCategories);

  useEffect(() => {
    setSelected(props.preferredCategories);
  }, [props.preferredCategories]);

  const save = useMutation({
    mutationFn: () => api.post(`/api/parties/${props.partyId}/me/preferences`, { categoryIds: selected }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["participant", "me", props.partyId] }),
  });

  const dirty = [...selected].sort().join("|") !== [...props.preferredCategories].sort().join("|");

  return (
    <section>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="section-title" style={{ padding: 0 }}>
          Que tipo de presente você curte?
        </legend>
        <p className="hint" style={{ marginBottom: 12 }}>
          Marque quantas quiser — quem te tirar usa isso pra não pagar mico.
        </p>
        <div className="options">
          {props.categories.map((c) => (
            <CheckOption
              key={c.id}
              label={c.label}
              checked={selected.includes(c.id)}
              onChange={(checked) =>
                setSelected(checked ? [...selected, c.id] : selected.filter((id) => id !== c.id))
              }
            />
          ))}
        </div>
      </fieldset>

      {save.isError && <ErrorBanner message={save.error.message} />}
      {save.isSuccess && !dirty && <Alert tone="success">Preferências salvas!</Alert>}
      <div className="form-actions" style={{ marginTop: 16 }}>
        <Button loading={save.isPending} disabled={!dirty} onClick={() => save.mutate()}>
          {save.isPending ? "Salvando…" : "Salvar preferências"}
        </Button>
        {dirty && <span className="hint">Alterações não salvas</span>}
      </div>
    </section>
  );
}
