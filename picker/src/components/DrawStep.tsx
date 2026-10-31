import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { burstFrom, cannons, rain, starBurst } from "../lib/confetti";
import { availablePool, pickWinners, SUSPENSE_MS, type DrawSettings, type Winner } from "../lib/draw";
import { copyText, download, pluralize, slugify, winnersCsv, winnersText } from "../lib/format";
import type { Candidate } from "../lib/rules";
import { sfx } from "../lib/sound";
import { ArrowLeft, Copy, Download, Expand, Shield, Shrink, Volume, VolumeOff } from "./icons";
import { SlotMachine, type Phase, type ReelSpec } from "./SlotMachine";
import { Spotlight, winnerKey, type SpotlightView } from "./Spotlight";
import { WinnersPanel } from "./WinnersPanel";

const SUSPENSE_LABEL = { quick: "Quick", normal: "Normal", dramatic: "Dramatic" } as const;

interface DrawStepProps {
  title: string;
  pool: Candidate[];
  settings: DrawSettings;
  onSettings: (s: DrawSettings) => void;
  winners: Winner[];
  onWinners: (w: Winner[]) => void;
  onEditRules: () => void;
}

export function DrawStep({ title, pool, settings, onSettings, winners, onWinners, onEditRules }: DrawStepProps) {
  const reduced = useReducedMotion() ?? false;
  const [phase, setPhase] = useState<Phase>("idle");
  const [spinId, setSpinId] = useState(0);
  const [targets, setTargets] = useState<Candidate[]>([]);
  const [roundStart, setRoundStart] = useState(1);
  const [view, setView] = useState<SpotlightView | null>(null);
  const [queued, setQueued] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [copied, setCopied] = useState(false);
  const landed = useRef(0);
  const poolAtSpin = useRef(0);
  const timers = useRef<number[]>([]);

  const available = useMemo(() => availablePool(pool, winners, settings.allowRepeat), [pool, winners, settings.allowRepeat]);
  const names = useMemo(() => [...new Set(pool.map((c) => c.name))], [pool]);
  const active = winners.filter((w) => w.status === "won");
  const remaining = Math.max(0, settings.winnerCount - active.length);
  const roundSize = settings.mode === "one" ? 1 : Math.min(remaining, available.length);
  const canSpin = phase === "idle" && !view && remaining > 0 && available.length > 0;

  const rankOf = useCallback(
    (w: Winner) => {
      const i = winners.filter((x) => x.status === "won").indexOf(w);
      return i >= 0 ? i + 1 : null;
    },
    [winners],
  );

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));

  const spin = useCallback(() => {
    if (!canSpin) return;
    const picks = pickWinners(available, roundSize, settings.allowRepeat);
    if (!picks.length) return;
    landed.current = 0;
    poolAtSpin.current = available.length;
    setRoundStart(active.length + 1);
    setTargets(picks);
    setPhase("spinning");
    setSpinId((id) => id + 1);
    if (settings.sound) sfx.whoosh();
  }, [canSpin, available, roundSize, settings.allowRepeat, settings.sound, active.length]);

  // "Draw next" and "redraw" close the spotlight first, then spin once state has settled.
  useEffect(() => {
    if (queued && phase === "idle" && !view) {
      setQueued(false);
      spin();
    }
  }, [queued, phase, view, spin]);

  const onReelLand = (_index: number, reel: HTMLDivElement | null) => {
    landed.current += 1;
    if (targets.length > 1) {
      if (reel) burstFrom(reel);
      if (settings.sound) sfx.land();
    }
    if (landed.current < targets.length) return;

    const drawnAt = new Date().toISOString();
    const round = winners.reduce((max, w) => Math.max(max, w.round), 0) + 1;
    const fresh: Winner[] = targets.map((candidate, i) => ({
      candidate,
      round,
      // Distinct timestamps keep keys unique when one round draws several winners.
      drawnAt: new Date(Date.parse(drawnAt) + i).toISOString(),
      poolSize: poolAtSpin.current,
      status: "won",
    }));
    onWinners([...winners, ...fresh]);
    setPhase("revealed");
    if (settings.sound) sfx.win();
    cannons();
    later(
      () => {
        setView(fresh.length === 1 ? { kind: "single", key: winnerKey(fresh[0]) } : { kind: "round", keys: fresh.map(winnerKey) });
        starBurst();
      },
      reduced ? 150 : 800,
    );
  };

  const closeView = () => {
    setView(null);
    setPhase("idle");
  };

  const disqualify = (w: Winner) => {
    onWinners(winners.map((x) => (x === w ? { ...x, status: "disqualified" } : x)));
    if (settings.sound) sfx.buzz();
  };

  const restore = (w: Winner) => {
    onWinners(winners.map((x) => (x === w ? { ...x, status: "won" } : x)));
    if (settings.sound) sfx.pop();
  };

  const redraw = (w: Winner) => {
    disqualify(w);
    closeView();
    setQueued(true);
  };

  const showFinal = () => {
    setView({ kind: "final" });
    setPhase("idle");
    if (settings.sound) sfx.fanfare();
    rain();
  };

  const primary =
    view?.kind === "final"
      ? { label: "Done", onClick: closeView }
      : remaining > 0
        ? {
            label: view?.kind === "round" ? `Draw ${pluralize(remaining, "replacement")}` : `Draw winner #${active.length + 1}`,
            onClick: () => {
              closeView();
              setQueued(true);
            },
          }
        : settings.winnerCount > 1 && view?.kind === "single"
          ? { label: "Celebrate all winners 🎉", onClick: showFinal }
          : { label: "Done", onClick: closeView };

  const copyAll = async () => {
    if (await copyText(winnersText(title, winners))) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) void document.documentElement.requestFullscreen().catch(() => setPresenting((p) => !p));
    else setPresenting((p) => !p);
  }, []);

  useEffect(() => {
    const onChange = () => setPresenting(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("presenting", presenting);
    return () => document.body.classList.remove("presenting");
  }, [presenting]);

  const primaryRef = useRef(primary.onClick);
  const closeRef = useRef(closeView);
  useEffect(() => {
    primaryRef.current = primary.onClick;
    closeRef.current = closeView;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest("input, textarea, select")) return;
      if (e.key === "Escape" && view) return closeRef.current();
      if (e.key === "f" && !e.metaKey && !e.ctrlKey) return toggleFullscreen();
      if (e.code !== "Space" && e.key !== "Enter") return;
      // A focused button already handles Space/Enter itself.
      if (el?.closest("button, a")) return;
      e.preventDefault();
      if (view) primaryRef.current();
      else spin();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, spin, toggleFullscreen]);

  const base = SUSPENSE_MS[settings.suspense];
  const reelCount = targets.length || Math.max(1, roundSize);
  const stagger = Math.min(450, 2800 / reelCount);
  const reels: ReelSpec[] = Array.from({ length: reelCount }, (_, i) => ({
    target: targets[i]?.name ?? null,
    label: reelCount > 1 ? `#${roundStart + i}` : undefined,
    duration: base + i * stagger,
  }));

  const buttonLabel =
    phase === "spinning"
      ? "Spinning…"
      : remaining === 0
        ? "All winners drawn"
        : available.length === 0
          ? "No entries left"
          : roundSize > 1
            ? `Draw ${roundSize} winners`
            : active.length === 0 && settings.winnerCount === 1
              ? "Spin!"
              : `Spin for #${active.length + 1}`;

  return (
    <div className="draw-layout">
      <div className="draw-stage">
        <div className="draw-toolbar">
          <button type="button" className="btn btn-ghost btn-sm hide-presenting" onClick={onEditRules} disabled={phase === "spinning"}>
            <ArrowLeft size={16} /> Edit rules
          </button>
          <div className="toolbar-spacer" />
          <button
            type="button"
            className="icon-btn is-large"
            onClick={() => onSettings({ ...settings, sound: !settings.sound })}
            title={settings.sound ? "Mute sounds" : "Turn sounds on"}
            aria-pressed={settings.sound}
          >
            {settings.sound ? <Volume size={20} /> : <VolumeOff size={20} />}
          </button>
          <button type="button" className="icon-btn is-large" onClick={toggleFullscreen} title={presenting ? "Exit presentation (F)" : "Presentation mode (F)"}>
            {presenting ? <Shrink size={20} /> : <Expand size={20} />}
          </button>
        </div>

        <SlotMachine
          title={title}
          reels={reels}
          names={names}
          spinId={spinId}
          phase={phase}
          sound={settings.sound}
          reduced={reduced}
          canSpin={canSpin}
          buttonLabel={buttonLabel}
          onSpin={spin}
          onReelLand={onReelLand}
          status={
            <>
              <span className="status-big">{available.length.toLocaleString()}</span>
              <span className="status-small">
                {available.length === 1 ? "entry" : "entries"} in the pool
                <br />
                {settings.mode === "one" ? "One by one" : "All at once"} · {SUSPENSE_LABEL[settings.suspense]}
              </span>
            </>
          }
        />

        <p className="fair-note">
          <Shield size={16} /> Winners are picked by your browser’s cryptographic random generator — every entry has exactly the same chance.
        </p>
      </div>

      <WinnersPanel
        title={title}
        winners={winners}
        target={settings.winnerCount}
        locked={phase === "spinning"}
        onDisqualify={disqualify}
        onRestore={restore}
        onClear={() => {
          onWinners([]);
          setTargets([]);
          setPhase("idle");
        }}
      />

      <Spotlight
        view={view}
        title={title}
        winners={winners}
        rankOf={rankOf}
        primary={primary}
        canRedraw={available.length > 0}
        onDisqualify={disqualify}
        onRedraw={redraw}
        onClose={closeView}
        extraActions={
          view?.kind === "final" && (
            <>
              <button type="button" className="btn btn-ghost btn-lg is-light" onClick={copyAll}>
                <Copy size={18} /> {copied ? "Copied!" : "Copy list"}
              </button>
              <button type="button" className="btn btn-ghost btn-lg is-light" onClick={() => download(`${slugify(title)}-winners.csv`, winnersCsv(winners))}>
                <Download size={18} /> Download CSV
              </button>
            </>
          )
        }
      />
    </div>
  );
}
