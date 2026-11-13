/** Placeholder — substituído nas tasks de front-end "admin + owner pages" e "participant + reveal pages". */
export function UnderConstruction(props: { title: string }) {
  return (
    <main style={{ maxWidth: 640, margin: "10vh auto", padding: "0 24px" }}>
      <h1 style={{ fontSize: 22 }}>{props.title}</h1>
      <p style={{ color: "#71717a" }}>Em construção.</p>
    </main>
  );
}
