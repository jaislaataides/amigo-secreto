/** Ref exposta pelos formulários que têm rascunho local (categorias, medidas) — ver ParticipantStepNav. */
export interface SaveHandle {
  saveIfDirty: () => Promise<void>;
}
