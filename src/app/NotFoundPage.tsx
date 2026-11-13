import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <main style={{ textAlign: "center", marginTop: "20vh" }}>
      <h1>404</h1>
      <p>Página não encontrada.</p>
      <Link to="/">Voltar ao início</Link>
    </main>
  );
}
