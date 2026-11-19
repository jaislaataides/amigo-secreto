import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

export function FullPageSpinner() {
  return (
    <div className="loading loading--full" role="status">
      <span className="spinner" aria-hidden="true" />
      Carregando…
    </div>
  );
}

/** Loading compacto, pra usar dentro de uma seção da página. */
export function InlineLoading(props: { label?: string }) {
  return (
    <div className="loading" role="status">
      <span className="spinner" aria-hidden="true" />
      {props.label ?? "Carregando…"}
    </div>
  );
}

type AlertTone = "error" | "success" | "warning" | "info";

const ALERT_ICON: Record<AlertTone, IconName> = {
  error: "alert",
  success: "checkCircle",
  warning: "alert",
  info: "info",
};

export function Alert(props: { tone: AlertTone; children: ReactNode }) {
  return (
    <div className={`alert alert--${props.tone}`} role={props.tone === "error" ? "alert" : "status"}>
      <Icon name={ALERT_ICON[props.tone]} size={18} />
      <div>{props.children}</div>
    </div>
  );
}

export function ErrorBanner(props: { message: string }) {
  return <Alert tone="error">{props.message}</Alert>;
}

export function EmptyState(props: { children: ReactNode; title?: string; icon?: IconName; action?: ReactNode }) {
  return (
    <div className="empty">
      <span className="empty__icon">
        <Icon name={props.icon ?? "gift"} size={26} />
      </span>
      {props.title && <p className="empty__title">{props.title}</p>}
      <p>{props.children}</p>
      {props.action && <div style={{ marginTop: 8 }}>{props.action}</div>}
    </div>
  );
}
