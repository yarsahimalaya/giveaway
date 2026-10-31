import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useId, useState, type CSSProperties, type ReactNode } from "react";
import { Check, Minus, Plus } from "./icons";

const spring = { type: "spring", stiffness: 520, damping: 34 } as const;

export function Card({
  icon,
  tone = "violet",
  title,
  subtitle,
  children,
  className = "",
}: {
  icon: ReactNode;
  tone?: "violet" | "sun" | "coral" | "mint" | "sky";
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card ${className}`}>
      <header className="card-head">
        <span className={`card-icon tone-${tone}`}>{icon}</span>
        <div>
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: ReactNode; icon?: ReactNode }[];
  onChange: (value: T) => void;
  label: string;
}) {
  const id = useId();
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={active} className={active ? "is-active" : ""} onClick={() => onChange(o.value)}>
            {active && <motion.span layoutId={`seg-${id}`} className="segmented-thumb" transition={spring} />}
            <span className="segmented-label">
              {o.icon}
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; hint?: ReactNode }) {
  return (
    <button type="button" role="switch" aria-checked={checked} className="toggle-row" onClick={() => onChange(!checked)}>
      <span className="toggle-text">
        <span className="toggle-label">{label}</span>
        {hint && <span className="hint">{hint}</span>}
      </span>
      <span className={`switch ${checked ? "is-on" : ""}`}>
        <motion.span className="switch-knob" layout transition={spring} />
      </span>
    </button>
  );
}

export function Chip({ on, onClick, children, count, style }: { on: boolean; onClick: () => void; children: ReactNode; count?: number; style?: CSSProperties }) {
  return (
    <motion.button type="button" aria-pressed={on} className={`chip ${on ? "is-on" : ""}`} onClick={onClick} whileTap={{ scale: 0.94 }}>
      <span className="chip-check" style={on ? style : undefined}>
        {on && <Check size={13} strokeWidth={3.2} />}
      </span>
      <span className="chip-label">{children}</span>
      {count !== undefined && <span className="chip-count">{count.toLocaleString()}</span>}
    </motion.button>
  );
}

export function NumberStepper({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (v: number) => void; label: string }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const commit = () => {
    const n = parseInt(draft, 10);
    const next = Number.isNaN(n) ? value : clamp(n);
    setDraft(String(next));
    if (next !== value) onChange(next);
  };
  return (
    <div className="number-stepper">
      <button type="button" aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => onChange(clamp(value - 1))}>
        <Minus size={18} strokeWidth={3} />
      </button>
      <input
        aria-label={label}
        inputMode="numeric"
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
      />
      <button type="button" aria-label={`Increase ${label}`} disabled={value >= max} onClick={() => onChange(clamp(value + 1))}>
        <Plus size={18} strokeWidth={3} />
      </button>
    </div>
  );
}

export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => Math.round(v).toLocaleString());
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.8, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [value, mv]);
  return <motion.span className={className}>{text}</motion.span>;
}

/** A button that asks for a second click before doing something destructive. */
export function ConfirmButton({
  children,
  confirmLabel = "Click again to confirm",
  onConfirm,
  className = "",
  title,
}: {
  children: ReactNode;
  confirmLabel?: ReactNode;
  onConfirm: () => void;
  className?: string;
  title?: string;
}) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      type="button"
      title={title}
      className={`${className} ${armed ? "is-armed" : ""}`}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else setArmed(true);
      }}
    >
      {armed ? confirmLabel : children}
    </button>
  );
}
