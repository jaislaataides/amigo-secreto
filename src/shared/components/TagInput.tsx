import { useState, type KeyboardEvent } from "react";

/** Input que vira "pills" removíveis ao apertar Enter — usado pra listas curtas de strings. */
export function TagInput(props: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function commitDraft() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (props.value.includes(trimmed)) {
      setDraft("");
      return;
    }
    props.onChange([...props.value, trimmed]);
    setDraft("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitDraft();
    } else if (e.key === "Backspace" && draft === "" && props.value.length > 0) {
      props.onChange(props.value.slice(0, -1));
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        padding: "8px 10px",
        borderRadius: 8,
        border: "1px solid #d4d4d8",
        alignItems: "center",
      }}
    >
      {props.value.map((tag) => (
        <span
          key={tag}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "#f4f4f5",
            color: "#18181b",
            borderRadius: 999,
            padding: "3px 10px",
            fontSize: 13,
          }}
        >
          {tag}
          <button
            type="button"
            onClick={() => props.onChange(props.value.filter((t) => t !== tag))}
            aria-label={`Remover ${tag}`}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#71717a",
              fontSize: 13,
              lineHeight: 1,
              padding: 0,
            }}
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commitDraft}
        placeholder={props.value.length === 0 ? props.placeholder : undefined}
        style={{
          border: "none",
          outline: "none",
          flex: 1,
          minWidth: 120,
          fontSize: 14,
          background: "transparent",
          color: "inherit",
        }}
      />
    </div>
  );
}
