/**
 * "Amico $ecreto": "mico" e "$" em verde. O "$" é só visual — leitores de
 * tela ouvem "Amico Secreto", e título da aba e e-mails seguem com "S".
 */
export function BrandName() {
  return (
    <span>
      A<em className="brand__mico">mico</em>{" "}
      <span aria-hidden="true">
        <em className="brand__mico">$</em>ecreto
      </span>
      <span className="sr-only">Secreto</span>
    </span>
  );
}
