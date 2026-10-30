import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { Winner } from "../lib/draw";
import { copyText, download, platformStyle, slugify, winnersCsv, winnersText } from "../lib/format";
import { Ban, Check, Copy, Download, External, Restore, Trophy } from "./icons";
import { winnerKey } from "./Spotlight";
import { ConfirmButton } from "./ui";

interface WinnersPanelProps {
  title: string;
  winners: Winner[];
  target: number;
  onDisqualify: (w: Winner) => void;
  onRestore: (w: Winner) => void;
  onClear: () => void;
  locked: boolean;
}

export function WinnersPanel({ title, winners, target, onDisqualify, onRestore, onClear, locked }: WinnersPanelProps) {
  const [copied, setCopied] = useState(false);
  const active = winners.filter((w) => w.status === "won").length;
  const progress = Math.min(100, (active / Math.max(1, target)) * 100);
  let rank = 0;

  const copy = async () => {
    if (await copyText(winnersText(title, winners))) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  return (
    <aside className="card winners-panel">
      <header className="card-head">
        <span className="card-icon tone-sun">
          <Trophy />
        </span>
        <div>
          <h3>Winners</h3>
          <p>
            {active} of {target} drawn
          </p>
        </div>
      </header>
      <div className="progress" role="progressbar" aria-valuenow={active} aria-valuemin={0} aria-valuemax={target}>
        <motion.span initial={false} animate={{ width: `${progress}%` }} transition={{ type: "spring", stiffness: 120, damping: 18 }} />
      </div>

      {winners.length === 0 ? (
        <div className="wp-empty">
          <div className="wp-empty-art" aria-hidden="true">
            <Trophy size={34} />
          </div>
          <p>Winners will land here as you draw them.</p>
        </div>
      ) : (
        <ol className="wp-list">
          <AnimatePresence initial={false}>
            {winners.map((w) => {
              const r = w.status === "won" ? ++rank : null;
              return (
                <motion.li
                  key={winnerKey(w)}
                  layout
                  className={`wp-item is-${w.status}`}
                  initial={{ opacity: 0, x: 60, scale: 0.85 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ type: "spring", stiffness: 380, damping: 26 }}
                >
                  <span className="wp-rank">{r ?? "–"}</span>
                  <div className="wp-info">
                    <strong title={w.candidate.name}>{w.candidate.name}</strong>
                    <span>
                      {w.status === "disqualified" ? (
                        <em>Disqualified</em>
                      ) : (
                        w.candidate.source && (
                          <span className="source-pill is-small" style={platformStyle(w.candidate.source)}>
                            {w.candidate.source}
                          </span>
                        )
                      )}
                    </span>
                  </div>
                  <div className="wp-actions">
                    {w.candidate.profile && (
                      <a className="icon-btn" href={w.candidate.profile} target="_blank" rel="noreferrer" title="Open profile">
                        <External size={16} />
                      </a>
                    )}
                    {w.status === "won" ? (
                      <ConfirmButton className="icon-btn is-danger" confirmLabel={<Check size={16} />} title="Disqualify (click twice)" onConfirm={() => onDisqualify(w)}>
                        <Ban size={16} />
                      </ConfirmButton>
                    ) : (
                      <button type="button" className="icon-btn" title={active >= target ? "All winner spots are filled" : "Restore winner"} disabled={active >= target || locked} onClick={() => onRestore(w)}>
                        <Restore size={16} />
                      </button>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ol>
      )}

      {winners.length > 0 && (
        <footer className="wp-foot">
          <button type="button" className="btn btn-ghost btn-sm" onClick={copy}>
            {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied!" : "Copy"}
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => download(`${slugify(title)}-winners.csv`, winnersCsv(winners))}>
            <Download size={16} /> CSV
          </button>
          <ConfirmButton className="btn btn-ghost btn-sm is-danger" confirmLabel="Clear all?" onConfirm={onClear}>
            Reset draw
          </ConfirmButton>
        </footer>
      )}
    </aside>
  );
}
