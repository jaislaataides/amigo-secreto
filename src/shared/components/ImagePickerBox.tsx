import { useRef } from "react";
import { Icon } from "./Icon";

/** Área clicável de capa: placeholder vazio ou prévia, sem expor o <input type="file"> cru. */
export function ImagePickerBox(props: {
  imageUrl: string | null;
  onFileSelected: (file: File | undefined) => void;
  busy?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasImage = Boolean(props.imageUrl);

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={props.busy}
        aria-label={hasImage ? "Trocar imagem de capa" : "Adicionar imagem de capa"}
        className={`image-picker${hasImage ? " has-image" : ""}`}
        style={hasImage ? { backgroundImage: `url(${props.imageUrl})` } : undefined}
      >
        {!hasImage && (
          <>
            <Icon name="image" size={28} />
            <span>Adicionar capa</span>
            <span className="hint" style={{ fontWeight: 400 }}>
              JPG ou PNG — opcional
            </span>
          </>
        )}
        {hasImage && (
          <span className="image-picker__overlay">
            {props.busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="image" size={16} />}
            {props.busy ? "Salvando…" : "Trocar capa"}
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          props.onFileSelected(e.target.files?.[0]);
          // Permite escolher o mesmo arquivo de novo depois de um erro.
          e.target.value = "";
        }}
        hidden
      />
    </>
  );
}
