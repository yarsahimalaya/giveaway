// Playful shapes drifting around the page edges; purely decorative.
const SHAPES = [
  { kind: "star", color: "var(--sun)", x: "0.6%", y: "30%", size: 44, dur: 9, delay: 0 },
  { kind: "ring", color: "var(--coral)", x: "96.4%", y: "9%", size: 50, dur: 11, delay: 1 },
  { kind: "squiggle", color: "var(--violet)", x: "95%", y: "80%", size: 66, dur: 13, delay: 2 },
  { kind: "tri", color: "var(--mint)", x: "0.8%", y: "82%", size: 42, dur: 10, delay: 0.5 },
  { kind: "plus", color: "var(--sky)", x: "97.2%", y: "46%", size: 32, dur: 8, delay: 1.5 },
  { kind: "dot", color: "var(--coral)", x: "1.6%", y: "58%", size: 18, dur: 7, delay: 2.5 },
  { kind: "dot", color: "var(--violet)", x: "97.6%", y: "64%", size: 14, dur: 9, delay: 3 },
] as const;

function Shape({ kind, color }: { kind: (typeof SHAPES)[number]["kind"]; color: string }) {
  const stroke = { stroke: "var(--ink)", strokeWidth: 2.5, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  switch (kind) {
    case "star":
      return <path d="M24 4l5.6 12.6L43 18l-10 9.2L35.6 41 24 34.2 12.4 41 15 27.2 5 18l13.4-1.4z" fill={color} {...stroke} />;
    case "ring":
      return <circle cx="24" cy="24" r="15" fill="none" stroke={color} strokeWidth="9" />;
    case "squiggle":
      return <path d="M4 30c5-10 9-10 13 0s8 10 13 0 9-10 14 0" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" />;
    case "tri":
      return <path d="M24 6l18 32H6z" fill={color} {...stroke} />;
    case "plus":
      return <path d="M24 6v36M6 24h36" stroke={color} strokeWidth="9" strokeLinecap="round" />;
    case "dot":
      return <circle cx="24" cy="24" r="18" fill={color} {...stroke} />;
  }
}

export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      {SHAPES.map((s, i) => (
        <svg
          key={i}
          viewBox="0 0 48 48"
          className={`float-shape shape-${s.kind}`}
          style={{ left: s.x, top: s.y, width: s.size, height: s.size, animationDuration: `${s.dur}s`, animationDelay: `-${s.delay}s` }}
        >
          <Shape kind={s.kind} color={s.color} />
        </svg>
      ))}
    </div>
  );
}
