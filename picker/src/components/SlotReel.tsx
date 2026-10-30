import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { sfx } from "../lib/sound";

export const PLACEHOLDER = "\u0000";

// rowH: px between names at the front of the drum; step: degrees of drum rotation per name.
const SIZES = {
  lg: { rowH: 70, step: 21, perspective: 1000 },
  sm: { rowH: 44, step: 30, perspective: 640 },
};

const WINDUP_MS = 260;
const SETTLE_MS = 460;
const WINDUP_ROWS = 0.3;
const OVERSHOOT_ROWS = 0.22;

function randomNames(names: string[], count: number, avoid?: string): string[] {
  if (!names.length) return Array<string>(count).fill("");
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    let n = names[Math.floor(Math.random() * names.length)];
    for (let guard = 0; names.length > 2 && (n === avoid || n === out[i - 1]) && guard < 8; guard++) {
      n = names[Math.floor(Math.random() * names.length)];
    }
    out.push(n);
  }
  return out;
}

const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

interface SlotReelProps {
  names: string[];
  target: string | null;
  spinId: number;
  duration: number;
  size: "lg" | "sm";
  sound: boolean;
  reduced: boolean;
  label?: string;
  onLand: (reel: HTMLDivElement | null) => void;
}

export function SlotReel({ names, target, spinId, duration, size, sound, reduced, label, onLand }: SlotReelProps) {
  const { rowH, step, perspective } = SIZES[size];
  const radius = rowH / Math.sin((step * Math.PI) / 180);
  const margin = Math.ceil(90 / step) + 1;

  const [strip, setStrip] = useState<string[]>(() => [...randomNames(names, margin), PLACEHOLDER, ...randomNames(names, margin)]);
  const rootRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);
  const blurRef = useRef<SVGFEGaussianBlurElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pointerRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const pos = useRef(margin);
  const plan = useRef<{ from: number; to: number } | null>(null);
  const handledSpin = useRef(0);
  const onLandRef = useRef(onLand);
  const soundRef = useRef(sound);
  const filterId = `reel-blur-${useId().replace(/[^\w-]/g, "")}`;

  useLayoutEffect(() => {
    onLandRef.current = onLand;
    soundRef.current = sound;
  });

  // Places each name on the drum: rotate it around the reel's axis, then fade by how far it faces away.
  const layout = useCallback(
    (p: number, blur: number) => {
      const items = itemRefs.current;
      for (let i = 0; i < items.length; i++) {
        const el = items[i];
        if (!el) continue;
        const angle = (i - p) * step;
        if (Math.abs(angle) >= 88) {
          el.style.visibility = "hidden";
          continue;
        }
        el.style.visibility = "visible";
        el.style.transform = `translateZ(${-radius}px) rotateX(${-angle}deg) translateZ(${radius}px)`;
        el.style.opacity = String(Math.max(0, (Math.cos((angle * Math.PI) / 180) - 0.2) / 0.8));
        el.classList.toggle("is-center", Math.abs(i - p) < 0.5);
      }
      if (stripRef.current) stripRef.current.style.filter = blur > 0.3 ? `url(#${filterId})` : "none";
      blurRef.current?.setAttribute("stdDeviation", `0 ${blur.toFixed(2)}`);
    },
    [step, radius, filterId],
  );

  const flickPointers = useCallback(() => {
    for (const el of pointerRefs.current) {
      if (!el) continue;
      const dir = Number(el.dataset.dir);
      el.animate([{ rotate: `${dir * 24}deg` }, { rotate: "0deg" }], { duration: 150, easing: "ease-out" });
    }
  }, []);

  // A new spin: build a fresh strip that starts on whatever is showing now and ends on the target.
  useEffect(() => {
    if (!spinId || target === null || spinId === handledSpin.current) return;
    handledSpin.current = spinId;
    const current = strip[Math.round(pos.current)] ?? PLACEHOLDER;
    const travel = reduced ? 8 : Math.round(14 + (duration / 1000) * 8.5);
    const lead = randomNames(names, margin, target);
    const fill = randomNames(names, travel - 1, target);
    const tail = randomNames(names, margin, target);
    plan.current = { from: lead.length, to: lead.length + travel };
    for (const el of itemRefs.current) el?.classList.remove("is-winner");
    setStrip([...lead, current, ...fill, target, ...tail]);
    // Only a new spinId should start a spin; the other inputs are read at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinId]);

  useLayoutEffect(() => {
    itemRefs.current.length = strip.length;
    const next = plan.current;
    if (!next) {
      layout(pos.current, 0);
      return;
    }
    plan.current = null;
    const { from, to } = next;
    const windup = reduced ? 0 : WINDUP_MS;
    const settle = reduced ? 0 : SETTLE_MS;
    const back = reduced ? 0 : WINDUP_ROWS;
    const over = reduced ? 0 : OVERSHOOT_ROWS;
    const spin = reduced ? 1000 : duration;

    // Speed ramps up linearly, then decays quadratically: fast blur, then a long, tense crawl.
    const start = from - back;
    const distance = to + over - start;
    const accel = spin * 0.14;
    const decel = spin - accel;
    const vmax = distance / (accel / 2 + decel / 3);
    const travelled = (t: number) => {
      if (t < accel) return (0.5 * vmax * t * t) / accel;
      const s = (t - accel) / decel;
      return 0.5 * vmax * accel + (vmax * decel * (1 - Math.pow(1 - s, 3))) / 3;
    };

    let raf = 0;
    let t0 = 0;
    let lastPos = from;
    let lastTime = 0;
    let lastIndex = from;
    let lastSound = 0;
    pos.current = from;
    layout(from, 0);

    const frame = (now: number) => {
      if (!t0) t0 = lastTime = now;
      const t = now - t0;
      let p: number;
      if (t < windup) p = from - back * easeOutQuad(t / windup);
      else if (t < windup + spin) p = start + travelled(t - windup);
      else if (t < windup + spin + settle) p = to + over * (1 - easeInOutCubic((t - windup - spin) / settle));
      else p = to;

      const velocity = Math.abs(p - lastPos) / Math.max(1, now - lastTime);
      const blur = reduced ? 0 : Math.min(10, Math.max(0, (velocity * rowH * 16 - 6) * 0.3));
      layout(p, blur);

      const index = Math.round(p);
      if (index !== lastIndex) {
        lastIndex = index;
        flickPointers();
        if (soundRef.current && now - lastSound > 34) {
          sfx.tick();
          lastSound = now;
        }
      }
      lastPos = p;
      lastTime = now;
      pos.current = p;

      if (t < windup + spin + settle) {
        raf = requestAnimationFrame(frame);
        return;
      }
      layout(to, 0);
      const winner = itemRefs.current[to];
      winner?.classList.add("is-winner");
      winner?.animate([{ scale: 1 }, { scale: 1.14 }, { scale: 1 }], { duration: 560, easing: "cubic-bezier(.3,1.7,.5,1)" });
      bandRef.current?.animate(
        [{ backgroundColor: "#FFC93C" }, { backgroundColor: "#FFF4CC" }, { backgroundColor: "#FFC93C" }, { backgroundColor: "#FFF4CC" }, { backgroundColor: "#FFC93C" }],
        { duration: 900, easing: "steps(4, jump-none)" },
      );
      onLandRef.current(rootRef.current);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strip]);

  return (
    <div ref={rootRef} className={`reel reel-${size}`}>
      {label && <span className="reel-label">{label}</span>}
      <div className="reel-viewport">
        <svg className="reel-filter" width="0" height="0" aria-hidden="true">
          <filter id={filterId} x="0" y="-20%" width="100%" height="140%">
            <feGaussianBlur ref={blurRef} stdDeviation="0 0" />
          </filter>
        </svg>
        <div ref={bandRef} className="reel-band" />
        <span ref={(el) => void (pointerRefs.current[0] = el)} className="reel-pointer is-left" data-dir="-1" aria-hidden="true">
          <svg viewBox="0 0 20 24">
            <path d="M3 3l14 9-14 9z" />
          </svg>
        </span>
        <span ref={(el) => void (pointerRefs.current[1] = el)} className="reel-pointer is-right" data-dir="1" aria-hidden="true">
          <svg viewBox="0 0 20 24">
            <path d="M17 3L3 12l14 9z" />
          </svg>
        </span>
        <div ref={stripRef} className="reel-strip">
          <div className="reel-drum" style={{ perspective }}>
            {strip.map((name, i) => (
              <div key={i} ref={(el) => void (itemRefs.current[i] = el)} className="reel-item" style={{ height: rowH, marginTop: -rowH / 2 }}>
                {name === PLACEHOLDER ? (
                  <span className="reel-placeholder">
                    <span>?</span>
                    <span>?</span>
                    <span>?</span>
                  </span>
                ) : (
                  <span className="reel-name">{name}</span>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="reel-shade" />
      </div>
    </div>
  );
}
