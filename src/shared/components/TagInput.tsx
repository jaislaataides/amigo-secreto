import { useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "./Icon";

/** Input que vira "pills" removíveis ao apertar Enter — usado pra listas curtas de strings. */
export function TagInput(props: {
  id?: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  "aria-describedby"?: string;
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function commitDraft() {
    const trimmed = draft.trim().replace(/,$/, "");
    if (!trimmed) return;
    if (!props.value.includes(trimmed)) props.onChange([...props.value, trimmed]);
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
    <div className="tag-input" onClick={() => inputRef.current?.focus()}>
      {props.value.map((tag) => (
        <span key={tag} className="tag">
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              props.onChange(props.value.filter((t) => t !== tag));
            }}
            aria-label={`Remover ${tag}`}
          >
            <Icon name="x" size={14} strokeWidth={2.5} />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        id={props.id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commitDraft}
        enterKeyHint="done"
        aria-describedby={props["aria-describedby"]}
        placeholder={props.value.length === 0 ? props.placeholder : "Adicionar mais…"}
      />
    </div>
  );
}
