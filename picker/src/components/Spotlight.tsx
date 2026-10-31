import { AnimatePresence, motion } from "motion/react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import type { Winner } from "../lib/draw";
import { shortUrl } from "../lib/entries";
import { avatarStyle, graphemes, initials, platformStyle } from "../lib/format";
import { Ban, External, Trophy } from "./icons";
import { ConfirmButton } from "./ui";

export type SpotlightView = { kind: "single"; key: string } | { kind: "round"; keys: string[] } | { kind: "final" };

export const winnerKey = (w: Winner) => `${w.candidate.id}|${w.drawnAt}`;

const LATIN = /^[\p{Script=Latin}\p{N}\p{P}\p{S}\s]+$/u;

/** Letters (or whole words, for scripts whose letters join up) bounce in one after another. */
function AnimatedName({ text, className, delay = 0.4 }: { text: string; className: string; delay?: number }) {
  const byLetter = LATIN.test(text);
  let n = 0;
  return (
    <h2 className={className} aria-label={text}>
      {text.split(/\s+/).map((word, wi) => (
        <span key={wi} className="name-word" aria-hidden="true">
          {(byLetter ? graphemes(word) : [word]).map((unit, ui) => (
            <motion.span
              key={ui}
              className="name-unit"
              initial={{ y: "0.6em", opacity: 0, rotate: 12, scale: 0.4 }}
              animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
              transition={{ delay: delay + n++ * (byLetter ? 0.035 : 0.12), type: "spring", stiffness: 520, damping: 17 }}
            >
              {unit}
            </motion.span>
          ))}
        </span>
      ))}
    </h2>
  );
}

function SourcePill({ source }: { source: string }) {
  return (
    <span className="source-pill" style={platformStyle(source)}>
      {source}
    </span>
  );
}

const SPARKS = [
  { x: "-6%", y: "8%", s: 34, d: 0 },
  { x: "102%", y: "14%", s: 26, d: 0.4 },
  { x: "96%", y: "86%", s: 38, d: 0.8 },
  { x: "-3%", y: "78%", s: 22, d: 1.2 },
  { x: "48%", y: "-5%", s: 20, d: 0.6 },
];

function Sparks() {
  return (
    <>
      {SPARKS.map((p, i) => (
        <svg key={i} className="spark" viewBox="0 0 24 24" style={{ left: p.x, top: p.y, width: p.s, height: p.s, animationDelay: `${p.d}s` }} aria-hidden="true">
          <path d="M12 1l2.6 8.4L23 12l-8.4 2.6L12 23l-2.6-8.4L1 12l8.4-2.6z" />
        </svg>
      ))}
    </>
  );
}

interface SpotlightProps {
  view: SpotlightView | null;
  title: string;
  winners: Winner[];
  rankOf: (w: Winner) => number | null;
  primary: { label: ReactNode; onClick: () => void };
  extraActions?: ReactNode;
  onDisqualify: (w: Winner) => void;
  onRedraw: (w: Winner) => void;
  canRedraw: boolean;
  onClose: () => void;
}

export function Spotlight({ view, title, winners, rankOf, primary, extraActions, onDisqualify, onRedraw, canRedraw, onClose }: SpotlightProps) {
  const byKey = new Map(winners.map((w) => [winnerKey(w), w]));
  const single = view?.kind === "single" ? byKey.get(view.key) : undefined;
  const list =
    view?.kind === "round"
      ? view.keys.map((k) => byKey.get(k)).filter((w): w is Winner => Boolean(w))
      : view?.kind === "final"
        ? winners.filter((w) => w.status === "won")
        : [];

  // Portalled so the header and the page's transform can't trap the fixed overlay.
  return createPortal(
    <AnimatePresence>
      {view && (
        <motion.div
          className="spotlight"
          role="dialog"
          aria-modal="true"
          aria-label="Winner announcement"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <div className="spotlight-rays" aria-hidden="true" />

          {single ? (
            <motion.div
              key={view.kind}
              className="reveal-card"
              initial={{ scale: 0.5, y: 90, opacity: 0, rotate: -6 }}
              animate={{ scale: 1, y: 0, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.92, y: 30, opacity: 0 }}
              transition={{ type: "spring", stiffness: 230, damping: 17 }}
            >
              <Sparks />
              <motion.div
                className="reveal-ribbon"
                initial={{ scale: 2.6, opacity: 0, rotate: -16 }}
                animate={{ scale: 1, opacity: 1, rotate: -3 }}
                transition={{ delay: 0.22, type: "spring", stiffness: 420, damping: 12 }}
              >
                <Trophy size={22} /> Winner #{rankOf(single) ?? "?"}
              </motion.div>
              <motion.div
                className="reveal-avatar"
                style={avatarStyle(single.candidate.personKey)}
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.32, type: "spring", stiffness: 380, damping: 14 }}
              >
                {initials(single.candidate.name)}
              </motion.div>
              <AnimatedName text={single.candidate.name} className="reveal-name" />
              <motion.div className="reveal-meta" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}>
                {single.candidate.source && <SourcePill source={single.candidate.source} />}
                {single.candidate.comments > 1 && <span className="meta-chip">{single.candidate.comments} comments</span>}
                {single.candidate.post && <span className="meta-chip">{shortUrl(single.candidate.post)}</span>}
              </motion.div>
              {single.candidate.comment && (
                <motion.blockquote className="reveal-comment" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.9, type: "spring", stiffness: 300, damping: 20 }}>
                  {single.candidate.comment}
                </motion.blockquote>
              )}
              <motion.div className="reveal-actions" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05 }}>
                <button type="button" className="btn btn-primary btn-lg" onClick={primary.onClick} autoFocus>
                  {primary.label}
                </button>
                <div className="reveal-secondary">
                  {single.candidate.profile && (
                    <a className="btn btn-ghost" href={single.candidate.profile} target="_blank" rel="noreferrer">
                      <External size={17} /> Check profile
                    </a>
                  )}
                  <ConfirmButton className="btn btn-ghost is-danger" confirmLabel="Sure? Click again" onConfirm={() => onRedraw(single)} title="Didn't follow the rules? Remove them and draw someone else.">
                    <Ban size={17} /> {canRedraw ? "Disqualify & redraw" : "Disqualify"}
                  </ConfirmButton>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key={view.kind}
              className="showcase"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
            >
              <motion.p className="showcase-eyebrow" initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 400, damping: 14 }}>
                <Trophy size={20} /> {title}
              </motion.p>
              <h2 className="showcase-title">
                {view.kind === "final" ? "Congratulations to our winners!" : `Meet your ${list.length === 1 ? "winner" : `${list.length} winners`}!`}
              </h2>
              <div className={`showcase-grid ${list.length <= 3 ? "is-few" : ""}`}>
                {list.map((w, i) => {
                  const rank = rankOf(w);
                  return (
                    <motion.article
                      key={winnerKey(w)}
                      className={`winner-tile is-${w.status}`}
                      initial={{ y: 50, opacity: 0, scale: 0.7, rotate: i % 2 ? 4 : -4 }}
                      animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2 + Math.min(i, 20) * 0.07, type: "spring", stiffness: 320, damping: 18 }}
                    >
                      <span className="tile-rank">{rank ? `#${rank}` : "Out"}</span>
                      <span className="avatar avatar-lg" style={avatarStyle(w.candidate.personKey)}>
                        {initials(w.candidate.name)}
                      </span>
                      <h4 className="tile-name">{w.candidate.name}</h4>
                      <div className="tile-meta">
                        {w.candidate.source && <SourcePill source={w.candidate.source} />}
                        {w.status === "disqualified" && <span className="meta-chip is-danger">Disqualified</span>}
                      </div>
                      {w.candidate.comment && <p className="tile-comment">{w.candidate.comment}</p>}
                      <div className="tile-actions">
                        {w.candidate.profile && (
                          <a className="icon-btn" href={w.candidate.profile} target="_blank" rel="noreferrer" title="Open profile">
                            <External size={16} />
                          </a>
                        )}
                        {view.kind === "round" && w.status === "won" && (
                          <ConfirmButton className="icon-btn is-danger" confirmLabel="Sure?" title="Disqualify" onConfirm={() => onDisqualify(w)}>
                            <Ban size={16} />
                          </ConfirmButton>
                        )}
                      </div>
                    </motion.article>
                  );
                })}
              </div>
              <motion.div className="showcase-actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                <button type="button" className="btn btn-primary btn-lg" onClick={primary.onClick} autoFocus>
                  {primary.label}
                </button>
                {extraActions}
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
