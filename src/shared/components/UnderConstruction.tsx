import { EmptyState } from "./Feedback";
import { Page } from "./ui";

/** Placeholder pra telas ainda não implementadas. */
export function UnderConstruction(props: { title: string }) {
  return (
    <Page maxWidth={640}>
      <EmptyState icon="sparkles" title={props.title}>
        Em construção.
      </EmptyState>
    </Page>
  );
}
