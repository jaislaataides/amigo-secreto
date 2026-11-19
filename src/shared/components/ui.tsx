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
  subtitle?: ReactNode;
  actions?: ReactNode;
  back?: { to: string; label: string };
  meta?: ReactNode;
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
        <h1 className="page-title">{props.title}</h1>
        {props.meta && <div className="page-meta">{props.meta}</div>}
        {props.subtitle && <p className="page-subtitle">{props.subtitle}</p>}
      </div>
      {props.actions}
    </header>
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
  props: ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconName; label: string; variant?: ButtonVariant; size?: ButtonSize },
) {
  const { icon, label, variant = "ghost", size = "md", className, ...rest } = props;
  return (
    <button
      type="button"
      {...rest}
      aria-label={label}
      title={label}
      className={buttonClass(variant, size, false, cx("btn--icon", className))}
    >
      <Icon name={icon} size={size === "sm" ? 16 : 18} />
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

/** Status discreto: pontinho colorido + texto. */
export function Status(props: { children: ReactNode; tone?: BadgeTone }) {
  return <span className={cx("status", `status--${props.tone ?? "neutral"}`)}>{props.children}</span>;
}

/** Seção de formulário: título e explicação à esquerda, campos à direita. */
export function FormSection(props: { title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <section className="form-section">
      <div className="form-section__intro">
        <h2>{props.title}</h2>
        {props.description && <p>{props.description}</p>}
      </div>
      <div className="form-section__fields">{props.children}</div>
    </section>
  );
}

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
