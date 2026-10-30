import type { CSSProperties, ReactNode } from "react";
import { Sparkle } from "./icons";
import { SlotReel } from "./SlotReel";

export type Phase = "idle" | "spinning" | "revealed";

export interface ReelSpec {
  target: string | null;
  label?: string;
  duration: number;
}

interface SlotMachineProps {
  title: string;
  reels: ReelSpec[];
  names: string[];
  spinId: number;
  phase: Phase;
  sound: boolean;
  reduced: boolean;
  canSpin: boolean;
  buttonLabel: ReactNode;
  status: ReactNode;
  onSpin: () => void;
  onReelLand: (index: number, reel: HTMLDivElement | null) => void;
}

const BULBS = 16;

function Bulbs({ side }: { side: "top" | "bottom" }) {
  return (
    <div className={`bulbs is-${side}`} aria-hidden="true">
      {Array.from({ length: BULBS }, (_, i) => (
        <span key={i} style={{ "--i": side === "top" ? i : BULBS - i } as CSSProperties} />
      ))}
    </div>
  );
}

export function SlotMachine({ title, reels, names, spinId, phase, sound, reduced, canSpin, buttonLabel, status, onSpin, onReelLand }: SlotMachineProps) {
  const single = reels.length === 1;
  return (
    <div className={`machine phase-${phase}`}>
      <div className="machine-sign">
        <Bulbs side="top" />
        <div className="machine-title">
          <Sparkle size={22} />
          <span>{title}</span>
          <Sparkle size={22} />
        </div>
        <Bulbs side="bottom" />
      </div>

      <div className="machine-body">
        <div className={`machine-window ${single ? "is-single" : "is-multi"}`} style={{ "--reels": reels.length } as CSSProperties}>
          {reels.map((reel, i) => (
            <SlotReel
              key={i}
              names={names}
              target={reel.target}
              spinId={spinId}
              duration={reel.duration}
              size={single ? "lg" : "sm"}
              label={reel.label}
              sound={sound && i === 0}
              reduced={reduced}
              onLand={(el) => onReelLand(i, el)}
            />
          ))}
        </div>

        <div className="machine-controls">
          <div className="machine-status">{status}</div>
          <button type="button" className="btn-spin" onClick={onSpin} disabled={!canSpin}>
            <span>{buttonLabel}</span>
            {canSpin && <kbd>Space</kbd>}
          </button>
        </div>

        <button type="button" className="lever" onClick={onSpin} disabled={!canSpin} aria-label="Pull the lever to spin">
          <span className="lever-socket" />
          <span key={spinId} className={`lever-arm ${spinId ? "is-pulled" : ""}`}>
            <span className="lever-ball" />
          </span>
        </button>
      </div>
    </div>
  );
}
