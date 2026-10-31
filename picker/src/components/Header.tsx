import { motion } from "motion/react";
import type { Step } from "../lib/storage";
import { Check } from "./icons";
import { ConfirmButton } from "./ui";

const STEPS: { key: Step; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "rules", label: "Rules" },
  { key: "draw", label: "Draw" },
];

interface HeaderProps {
  step: Step;
  enabled: Record<Step, boolean>;
  onStep: (s: Step) => void;
  onReset: () => void;
  hasData: boolean;
}

export function Header({ step, enabled, onStep, onReset, hasData }: HeaderProps) {
  const current = STEPS.findIndex((s) => s.key === step);
  return (
    <header className="topbar">
      <div className="brand">
        <motion.span className="brand-mark" whileHover={{ rotate: -12, scale: 1.08 }} transition={{ type: "spring", stiffness: 400, damping: 12 }}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2.5l2.7 6.1 6.6.6-5 4.4 1.5 6.5L12 16.7l-5.8 3.4 1.5-6.5-5-4.4 6.6-.6z" />
          </svg>
        </motion.span>
        <span className="brand-name">
          Winner<span>Picker</span>
        </span>
      </div>

      <nav className="steps" aria-label="Steps">
        {STEPS.map((s, i) => {
          const isActive = s.key === step;
          const done = i < current;
          return (
            <button key={s.key} type="button" className={`step ${isActive ? "is-active" : ""} ${done ? "is-done" : ""}`} disabled={!enabled[s.key]} onClick={() => onStep(s.key)} aria-current={isActive ? "step" : undefined}>
              {isActive && <motion.span layoutId="step-thumb" className="step-thumb" transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
              <span className="step-num">{done ? <Check size={13} strokeWidth={3.4} /> : i + 1}</span>
              <span className="step-label">{s.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="topbar-end">
        <a className="btn btn-ghost btn-sm" href="./about/">
          How to use
        </a>
        {hasData && (
          <ConfirmButton className="btn btn-ghost btn-sm" confirmLabel="Clear everything?" onConfirm={onReset} title="Remove the uploaded data, rules and winners">
            Start over
          </ConfirmButton>
        )}
      </div>
    </header>
  );
}
