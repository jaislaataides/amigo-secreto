import { useRef } from "react";

/** Caixa clicável de imagem: mostra placeholder vazio ou a prévia, sem expor o <input type="file"> cru. */
export function ImagePickerBox(props: {
  imageUrl: string | null;
  onFileSelected: (file: File | undefined) => void;
  size?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const size = props.size ?? 180;

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        style={{
          width: size,
          height: size,
          borderRadius: 12,
          border: props.imageUrl ? "1px solid #e4e4e7" : "2px dashed #d4d4d8",
          background: props.imageUrl ? `url(${props.imageUrl}) center/cover no-repeat` : "transparent",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          color: "#71717a",
          padding: 0,
        }}
      >
        {!props.imageUrl && (
          <>
            <span style={{ fontSize: 28 }}>🖼️</span>
            <span style={{ fontSize: 13 }}>Adicionar capa</span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => props.onFileSelected(e.target.files?.[0])}
        style={{ display: "none" }}
      />
      {props.imageUrl && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{
            marginTop: 8,
            background: "none",
            border: "none",
            color: "#71717a",
            textDecoration: "underline",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Trocar imagem
        </button>
      )}
    </div>
  );
}
