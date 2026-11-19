import type {
  ButtonHTMLAttributes,
  CSSProperties,
  InputHTMLAttributes,
  LabelHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import { Link, NavLink, type LinkProps } from "react-router-dom";
import { Icon, type IconName } from "./Icon";

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ---------- Layout ---------- */

export function Page(props: { children: ReactNode; maxWidth?: number }) {
  return (
    <main className="page" style={props.maxWidth ? ({ "--page-max": `${props.maxWidth}px` } as CSSProperties) : undefined}>
      {props.children}
    </main>
  );
}

export function PageHeader(props: {
  title: string;
  /** Palavra do título que ganha o rabisco verde (só em telas principais). */
  highlight?: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  back?: { to: string; label: string };
}) {
  return (
    <header className="page-header">
      <div className="page-header__text">
        {props.back && (
          <Link to={props.back.to} className="page-header__back">
            <Icon name="arrowLeft" size={16} />
            {props.back.label}
          </Link>
        )}
        <h1 className="page-title">{withSquiggle(props.title, props.highlight)}</h1>
        {props.subtitle && <p className="page-subtitle">{props.subtitle}</p>}
      </div>
      {props.actions}
    </header>
  );
}

function withSquiggle(title: string, word?: string): ReactNode {
  const i = word ? title.lastIndexOf(word) : -1;
  if (!word || i < 0) return title;
  return (
    <>
      {title.slice(0, i)}
      <span className="squiggle">{word}</span>
      {title.slice(i + word.length)}
    </>
  );
}

export function Stack(props: { children: ReactNode; gap?: number; className?: string }) {
  return (
    <div
      className={cx("stack", props.className)}
      style={props.gap !== undefined ? ({ "--stack-gap": `${props.gap}px` } as CSSProperties) : undefined}
    >
      {props.children}
    </div>
  );
}

export function Section(props: { title: string; count?: number; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="section">
      <div className="row row--between" style={{ marginBottom: 12 }}>
        <h2 className="section-title" style={{ margin: 0 }}>
          {props.title}
          {props.count !== undefined && <span className="count">{props.count}</span>}
        </h2>
        {props.actions}
      </div>
      {props.children}
    </section>
  );
}

export function Card(props: { children: ReactNode; style?: CSSProperties; flush?: boolean; className?: string }) {
  return (
    <div className={cx("card", props.flush && "card--flush", props.className)} style={props.style}>
      {props.children}
    </div>
  );
}

export function Avatar(props: { name: string }) {
  const initials = props.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span className="avatar" aria-hidden="true">
      {initials || "?"}
    </span>
  );
}

/* ---------- Form ---------- */

export function Field(props: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  hint?: ReactNode;
  optional?: boolean;
}) {
  const hintId = props.hint && props.htmlFor ? `${props.htmlFor}-hint` : undefined;
  return (
    <div className="field">
      <Label htmlFor={props.htmlFor}>
        {props.label}
        {props.optional && <span className="label__optional"> (opcional)</span>}
      </Label>
      {props.children}
      {props.hint && (
        <p className="hint" id={hintId}>
          {props.hint}
        </p>
      )}
    </div>
  );
}

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  const { className, ...rest } = props;
  return <label {...rest} className={cx("label", className)} />;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input {...rest} className={cx("input", className)} />;
}

export function MoneyInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="input-prefix">
      <span aria-hidden="true">R$</span>
      <Input type="number" inputMode="decimal" min={0} {...props} />
    </div>
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return <textarea {...rest} className={cx("textarea", className)} />;
}

/** Checkbox em formato de chip — área de toque grande e estado bem visível. */
export function CheckOption(props: {
  label: ReactNode;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={cx("option", props.checked && "is-checked", props.disabled && "is-disabled")}>
      <input
        type="checkbox"
        checked={props.checked}
        disabled={props.disabled}
        onChange={(e) => props.onChange(e.target.checked)}
      />
      <span className="option__box">
        <Icon name="check" size={14} strokeWidth={3} />
      </span>
      <span>{props.label}</span>
    </label>
  );
}

/* ---------- Buttons ---------- */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

function buttonClass(variant: ButtonVariant, size: ButtonSize, block?: boolean, extra?: string) {
  return cx("btn", `btn--${variant}`, size !== "md" && `btn--${size}`, block && "btn--block", extra);
}

export function Button(
  props: ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    block?: boolean;
    loading?: boolean;
    icon?: IconName;
  },
) {
  const { variant = "primary", size = "md", block, loading, icon, className, children, disabled, ...rest } = props;
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass(variant, size, block, className)}
    >
      {loading ? <span className="spinner" aria-hidden="true" /> : icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  );
}

/** Botão apenas com ícone — exige um rótulo acessível. */
export function IconButton(
  props: ButtonHTMLAttributes<HTMLButtonElement> & {
    icon: IconName;
    label: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    /** Troca o ícone por um spinner e bloqueia o botão. */
    loading?: boolean;
  },
) {
  const { icon, label, variant = "ghost", size = "md", loading, disabled, className, ...rest } = props;
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-label={label}
      title={label}
      className={buttonClass(variant, size, false, cx("btn--icon", className))}
    >
      {loading ? <span className="spinner" aria-hidden="true" /> : <Icon name={icon} size={size === "sm" ? 16 : 18} />}
    </button>
  );
}

/** Link com cara de botão (evita <button> dentro de <a>, que é HTML inválido). */
export function ButtonLink(props: LinkProps & { variant?: ButtonVariant; size?: ButtonSize; icon?: IconName; block?: boolean }) {
  const { variant = "primary", size = "md", icon, block, className, children, ...rest } = props;
  return (
    <Link {...rest} className={buttonClass(variant, size, block, className as string | undefined)}>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </Link>
  );
}

/* ---------- Badge ---------- */

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "brand";

export function Badge(props: { children: ReactNode; tone?: BadgeTone; icon?: IconName }) {
  return (
    <span className={cx("badge", `badge--${props.tone ?? "neutral"}`)}>
      {props.icon && <Icon name={props.icon} size={14} strokeWidth={2.5} />}
      {props.children}
    </span>
  );
}

/* ---------- Tabs ---------- */

export function Tabs(props: { label: string; items: { to: string; label: string; icon?: IconName }[] }) {
  return (
    <nav className="tabs" aria-label={props.label}>
      {props.items.map((item) => (
        <NavLink key={item.to} to={item.to} className="tab">
          {item.icon && <Icon name={item.icon} size={16} />}
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
