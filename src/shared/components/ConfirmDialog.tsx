import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "./ui";

/**
 * Confirmação dentro do app (no lugar do window.confirm do navegador).
 * Usa o <dialog> nativo em modo modal: foco preso no diálogo, Esc cancela,
 * fundo inerte. `useConfirm()` devolve uma função que resolve true/false.
 */
export interface ConfirmOptions {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" pra ações destrutivas (remover). */
  tone?: "primary" | "danger";
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider(props: { children: ReactNode }) {
  const [request, setRequest] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);

  const confirm = useCallback<ConfirmFn>(
    (options) =>
      new Promise<boolean>((resolve) => {
        setRequest({ ...options, resolve });
      }),
    [],
  );

  const close = (ok: boolean) => {
    request?.resolve(ok);
    setRequest(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {props.children}
      {request && <ConfirmDialog options={request} onClose={close} />}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within a ConfirmProvider");
  return ctx;
}

function ConfirmDialog(props: { options: ConfirmOptions; onClose: (ok: boolean) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const { options } = props;

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="confirm-title"
      aria-describedby={options.message ? "confirm-message" : undefined}
      // Esc dispara "cancel": trata como "Cancelar".
      onCancel={(e) => {
        e.preventDefault();
        props.onClose(false);
      }}
      // Clique no fundo escurecido fecha (o próprio <dialog> é o alvo).
      onClick={(e) => {
        if (e.target === ref.current) props.onClose(false);
      }}
    >
      <div className="dialog__body">
        <h2 id="confirm-title" className="dialog__title">
          {options.title}
        </h2>
        {options.message && (
          <p id="confirm-message" className="muted">
            {options.message}
          </p>
        )}
        <div className="dialog__actions">
          <Button variant="secondary" onClick={() => props.onClose(false)}>
            {options.cancelLabel ?? "Cancelar"}
          </Button>
          <Button
            variant={options.tone === "danger" ? "danger" : "primary"}
            className={options.tone === "danger" ? "btn--danger-solid" : undefined}
            onClick={() => props.onClose(true)}
            autoFocus
          >
            {options.confirmLabel ?? "Confirmar"}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
