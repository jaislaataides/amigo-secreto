import type { ReactNode } from "react";
import { Icon } from "./Icon";

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Cartão de link de produto: miniatura, título, domínio e descrição. */
export function LinkPreview(props: {
  url: string;
  title: string | null;
  imageUrl: string | null;
  description: string | null;
  domain?: string | null;
  action?: ReactNode;
}) {
  return (
    <div className="card link-card">
      {props.imageUrl ? (
        <img src={props.imageUrl} alt="" className="link-card__thumb" loading="lazy" />
      ) : (
        <span className="link-card__thumb">
          <Icon name="link" size={22} />
        </span>
      )}
      <div className="link-card__body">
        <div className="link-card__domain">{props.domain || domainOf(props.url)}</div>
        <a href={props.url} target="_blank" rel="noreferrer" className="link-card__title">
          {props.title || props.url}
          <span className="sr-only"> (abre em nova aba)</span>
        </a>
        {props.description && <p className="link-card__desc">{props.description}</p>}
      </div>
      {props.action}
    </div>
  );
}
