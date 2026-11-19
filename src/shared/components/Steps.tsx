import { Icon, type IconName } from "./Icon";

export interface Step {
  icon: IconName;
  title: string;
  text: string;
}

/** Passos numerados em cards ("como funciona"). */
export function Steps(props: { steps: Step[] }) {
  return (
    <ol className="steps">
      {props.steps.map((step, i) => (
        <li key={step.title} className="card steps__item">
          <span className="steps__number">{i + 1}</span>
          <span className="home-link__icon">
            <Icon name={step.icon} size={22} />
          </span>
          <strong>{step.title}</strong>
          <span className="muted small">{step.text}</span>
        </li>
      ))}
    </ol>
  );
}
