import { useEffect, useState } from "react";

/**
 * Campo de data em dd/mm/aaaa sempre nesse formato, independente da
 * localidade do navegador (o <input type="date"> nativo respeita o locale
 * do sistema, que em muitos casos mostra mm/dd/aaaa mesmo com o app em
 * português). Valor exposto/recebido como "YYYY-MM-DD".
 */
export function DateInputBR(props: { value: string; onChange: (next: string) => void }) {
  const parsed = parseIso(props.value);
  const [day, setDay] = useState(parsed.day);
  const [month, setMonth] = useState(parsed.month);
  const [year, setYear] = useState(parsed.year);

  useEffect(() => {
    const next = parseIso(props.value);
    setDay(next.day);
    setMonth(next.month);
    setYear(next.year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.value]);

  function emit(d: string, m: string, y: string) {
    if (d.length === 2 && m.length === 2 && y.length === 4) {
      props.onChange(`${y}-${m}-${d}`);
    }
  }

  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <Segment placeholder="dd" maxLength={2} width={48} value={day} onChange={(v) => { setDay(v); emit(v, month, year); }} />
      <span style={{ color: "#71717a" }}>/</span>
      <Segment placeholder="mm" maxLength={2} width={48} value={month} onChange={(v) => { setMonth(v); emit(day, v, year); }} />
      <span style={{ color: "#71717a" }}>/</span>
      <Segment placeholder="aaaa" maxLength={4} width={68} value={year} onChange={(v) => { setYear(v); emit(day, month, v); }} />
    </div>
  );
}

function Segment(props: { placeholder: string; maxLength: number; width: number; value: string; onChange: (v: string) => void }) {
  return (
    <input
      inputMode="numeric"
      placeholder={props.placeholder}
      value={props.value}
      maxLength={props.maxLength}
      onChange={(e) => props.onChange(e.target.value.replace(/\D/g, "").slice(0, props.maxLength))}
      style={{
        width: props.width,
        padding: "8px 10px",
        borderRadius: 8,
        border: "1px solid #d4d4d8",
        fontSize: 14,
        textAlign: "center",
        boxSizing: "border-box",
      }}
    />
  );
}

function parseIso(value: string): { day: string; month: string; year: string } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return { day: "", month: "", year: "" };
  const [, y, m, d] = match;
  return { day: d!, month: m!, year: y! };
}
