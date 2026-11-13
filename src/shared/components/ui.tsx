import type {
  ButtonHTMLAttributes,
  CSSProperties,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

export function PageHeader(props: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
      <div>
        <h1 style={{ fontSize: 24, margin: 0 }}>{props.title}</h1>
        {props.subtitle && <p style={{ color: "#71717a", margin: "4px 0 0", fontSize: 14 }}>{props.subtitle}</p>}
      </div>
      {props.actions}
    </header>
  );
}

export function Page(props: { children: ReactNode; maxWidth?: number }) {
  return (
    <main style={{ maxWidth: props.maxWidth ?? 720, margin: "0 auto", padding: "40px 20px 80px" }}>
      {props.children}
    </main>
  );
}

export function Card(props: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        border: "1px solid #e4e4e7",
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        background: "#fff",
        ...props.style,
      }}
    >
      {props.children}
    </div>
  );
}

export function Field(props: { label: string; htmlFor?: string; children: ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Label htmlFor={props.htmlFor}>{props.label}</Label>
      {props.children}
      {props.hint && <p style={{ fontSize: 12, color: "#71717a", margin: "4px 0 0" }}>{props.hint}</p>}
    </div>
  );
}

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, ...props.style }} />;
}

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #d4d4d8",
  fontSize: 14,
  boxSizing: "border-box",
};

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...inputStyle, ...props.style }} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} style={{ ...inputStyle, minHeight: 80, fontFamily: "inherit", ...props.style }} />;
}

export function Button(
  props: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" },
) {
  const { variant = "primary", style, ...rest } = props;
  const palette = {
    primary: { background: "#18181b", color: "#fff" },
    secondary: { background: "#f4f4f5", color: "#18181b" },
    danger: { background: "#fef2f2", color: "#991b1b" },
  }[variant];

  return (
    <button
      {...rest}
      style={{
        border: "none",
        borderRadius: 8,
        padding: "9px 16px",
        fontSize: 14,
        fontWeight: 600,
        cursor: rest.disabled ? "not-allowed" : "pointer",
        opacity: rest.disabled ? 0.6 : 1,
        ...palette,
        ...style,
      }}
    />
  );
}

export function Badge(props: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" }) {
  const tones = {
    neutral: { background: "#f4f4f5", color: "#52525b" },
    success: { background: "#dcfce7", color: "#166534" },
    warning: { background: "#fef9c3", color: "#854d0e" },
    danger: { background: "#fef2f2", color: "#991b1b" },
  };
  const palette = tones[props.tone ?? "neutral"];
  return (
    <span
      style={{
        ...palette,
        borderRadius: 999,
        padding: "2px 10px",
        fontSize: 12,
        fontWeight: 600,
        display: "inline-block",
      }}
    >
      {props.children}
    </span>
  );
}
