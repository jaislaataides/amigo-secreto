import type { ReactNode } from "react";

export function FullPageSpinner() {
  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "60vh", color: "#71717a" }}>
      Carregando…
    </div>
  );
}

export function ErrorBanner(props: { message: string }) {
  return (
    <div
      style={{
        background: "#fef2f2",
        color: "#991b1b",
        border: "1px solid #fecaca",
        borderRadius: 8,
        padding: "12px 16px",
        margin: "16px 0",
        fontSize: 14,
      }}
    >
      {props.message}
    </div>
  );
}

export function EmptyState(props: { children: ReactNode }) {
  return (
    <div
      style={{
        color: "#71717a",
        textAlign: "center",
        padding: "48px 16px",
        fontSize: 14,
      }}
    >
      {props.children}
    </div>
  );
}
