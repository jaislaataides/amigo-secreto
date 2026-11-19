import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { useLocation, useNavigationType, type Location } from "react-router-dom";

/**
 * Transição entre páginas sem migrar pro "data router": as rotas renderizam
 * a localização *exibida*, que só troca pra nova dentro de
 * document.startViewTransition. O navegador fotografa a página antiga,
 * aplica a nova e anima entre as duas (CSS em global.css, "Transição entre
 * páginas"). Vale pra clique, voltar e avançar.
 *
 * Sem suporte à View Transitions API (ou com "reduzir movimento"), troca
 * na hora e a página nova usa a entrada simples do .page.
 */
export function useViewTransitionLocation(): Location {
  const location = useLocation();
  const navigationType = useNavigationType();
  const [shown, setShown] = useState(location);

  useEffect(() => {
    if (location.key === shown.key) return;

    const apply = () => {
      setShown(location);
      // Navegação nova começa do topo; voltar/avançar deixa o navegador
      // restaurar a posição.
      if (navigationType !== "POP") window.scrollTo(0, 0);
    };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (typeof document.startViewTransition !== "function" || reduceMotion) {
      apply();
      return;
    }

    const root = document.documentElement;
    root.classList.add("vt-running");
    const transition = document.startViewTransition(() => flushSync(apply));
    void transition.finished.finally(() => root.classList.remove("vt-running"));
  }, [location, navigationType, shown.key]);

  return shown;
}
