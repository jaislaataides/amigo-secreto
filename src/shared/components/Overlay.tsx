import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

/* ---------- Toasts: retorno curto depois de uma ação ---------- */

interface Toast {
  id: number;
  message: string;
  leaving: boolean;
}

interface ConfirmOptions {
  title: string;
  body?: ReactNode;
  confirmLabel: string;
  danger?: boolean;
}

interface OverlayApi {
  toast: (message: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const OverlayContext = createContext<OverlayApi | null>(null);

const TOAST_MS = 3200;
const EXIT_MS = 160;

export function OverlayProvider(props: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const toast = useCallback((message: string) => {
    const id = nextId.current++;
    setToasts((list) => [...list.slice(-2), { id, message, leaving: false }]);
    window.setTimeout(() => {
      setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      window.setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), EXIT_MS);
    }, TOAST_MS);
  }, []);

  const [pending, setPending] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);

  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setPending({ ...options, resolve })),
    [],
  );

  return (
    <OverlayContext.Provider value={{ toast, confirm }}>
      {props.children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast${t.leaving ? " is-leaving" : ""}`}>
            {t.message}
          </div>
        ))}
      </div>
      {pending && (
        <ConfirmDialog
          {...pending}
          onClose={(ok) => {
            pending.resolve(ok);
            setPending(null);
          }}
        />
      )}
    </OverlayContext.Provider>
  );
}

export function useOverlay(): OverlayApi {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error("useOverlay precisa estar dentro de <OverlayProvider>");
  return ctx;
}

/* ---------- Confirmação: <dialog> nativo (foco preso, Esc fecha) ---------- */

function ConfirmDialog(props: ConfirmOptions & { onClose: (ok: boolean) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  function close(ok: boolean) {
    setClosing(true);
    window.setTimeout(() => {
      ref.current?.close();
      props.onClose(ok);
    }, EXIT_MS);
  }

  return (
    <dialog
      ref={ref}
      className={`dialog${closing ? " is-leaving" : ""}`}
      aria-labelledby="confirm-title"
      onCancel={(e) => {
        e.preventDefault();
        close(false);
      }}
      onClick={(e) => {
        // clique no fundo escurecido fecha
        if (e.target === ref.current) close(false);
      }}
    >
      <div className="dialog__panel">
        <h2 id="confirm-title">{props.title}</h2>
        {props.body && <div className="dialog__body">{props.body}</div>}
        <div className="dialog__actions">
          <button type="button" className="btn btn--ghost" onClick={() => close(false)}>
            Cancelar
          </button>
          <button
            type="button"
            className={`btn ${props.danger ? "btn--danger-solid" : "btn--primary"}`}
            onClick={() => close(true)}
            autoFocus
          >
            {props.confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
