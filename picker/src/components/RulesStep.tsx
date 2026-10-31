import { AnimatePresence, motion } from "motion/react";
import { useDeferredValue, useMemo, useState } from "react";
import type { DrawSettings, RevealMode, Suspense } from "../lib/draw";
import { shortUrl, type Facets } from "../lib/entries";
import { avatarStyle, initials, platformStyle, pluralize } from "../lib/format";
import type { Candidate, Pool, Rules } from "../lib/rules";
import { ArrowLeft, ArrowRight, Ban, Filter, Grid, Layers, Pencil, Search, Sparkle, Users, Zap } from "./icons";
import { AnimatedNumber, Card, Chip, NumberStepper, Segmented, Toggle } from "./ui";

interface RulesStepProps {
  title: string;
  onTitle: (t: string) => void;
  facets: Facets;
  rules: Rules;
  onRules: (r: Rules) => void;
  settings: DrawSettings;
  onSettings: (s: DrawSettings) => void;
  pool: Pool;
  drawnCount: number;
  onBack: () => void;
  onNext: () => void;
}

const LIST_LIMIT = 150;

function toggleIn(list: string[], value: string) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function RulesStep({ title, onTitle, facets, rules, onRules, settings, onSettings, pool, drawnCount, onBack, onNext }: RulesStepProps) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const set = <K extends keyof Rules>(key: K, value: Rules[K]) => onRules({ ...rules, [key]: value });
  const setDraw = <K extends keyof DrawSettings>(key: K, value: DrawSettings[K]) => onSettings({ ...settings, [key]: value });

  const eligible = pool.candidates.length;
  const people = new Set(pool.candidates.map((c) => c.personKey)).size;
  const maxWinners = Math.max(1, settings.allowRepeat ? eligible : people);

  const filtered = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return pool.candidates;
    return pool.candidates.filter((c) => c.name.toLowerCase().includes(q) || c.comment.toLowerCase().includes(q));
  }, [pool.candidates, deferredQuery]);

  const exclude = (c: Candidate) => {
    const line = c.profile || c.name;
    set("excludeList", rules.excludeList.trim() ? `${rules.excludeList.trimEnd()}\n${line}` : line);
  };

  return (
    <div className="rules-layout">
      <div className="rules-main">
        <header className="step-head">
          <span className="eyebrow">Step 2 · Your giveaway, your rules</span>
          <h2>Who makes it into the draw?</h2>
          <p className="lead">Every change updates the pool on the right instantly.</p>
        </header>

        <Card icon={<Users />} tone="violet" title="Entries" subtitle="Did people comment more than once? Decide whether that earns extra chances.">
          <Segmented
            label="How entries count"
            value={rules.onePerPerson ? "person" : "comment"}
            onChange={(v) => set("onePerPerson", v === "person")}
            options={[
              { value: "person", label: "One entry per person" },
              { value: "comment", label: "Every comment counts" },
            ]}
          />
          <AnimatePresence mode="wait" initial={false}>
            <motion.p key={String(rules.onePerPerson)} className="hint hint-block" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
              {rules.onePerPerson
                ? "Duplicates are merged by profile link (or name when there’s no link). Commenting 10 times doesn’t raise anyone’s odds."
                : "Each comment is its own ticket, so people who commented more have better odds."}
            </motion.p>
          </AnimatePresence>
        </Card>

        <Card icon={<Filter />} tone="mint" title="Filters" subtitle="Only comments that pass every filter go into the draw.">
          <div className="filter-groups">
            {facets.sources.length > 0 && (
              <div className="filter-group">
                <span className="group-label">Platforms</span>
                <div className="chips">
                  {facets.sources.map((f) => (
                    <Chip key={f.value} on={!rules.excludedSources.includes(f.value)} count={f.count} style={platformStyle(f.value)} onClick={() => set("excludedSources", toggleIn(rules.excludedSources, f.value))}>
                      {f.value}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {facets.posts.length > 1 && (
              <div className="filter-group">
                <span className="group-label">Posts</span>
                <div className="chips">
                  {facets.posts.map((f) => (
                    <Chip key={f.value} on={!rules.excludedPosts.includes(f.value)} count={f.count} onClick={() => set("excludedPosts", toggleIn(rules.excludedPosts, f.value))}>
                      <span title={f.value}>{shortUrl(f.value)}</span>
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {facets.types.length > 1 && (
              <div className="filter-group">
                <span className="group-label">Comment types</span>
                <div className="chips">
                  {facets.types.map((f) => (
                    <Chip key={f.value} on={!rules.excludedTypes.includes(f.value)} count={f.count} onClick={() => set("excludedTypes", toggleIn(rules.excludedTypes, f.value))}>
                      {f.value}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            <Toggle checked={rules.skipEmpty} onChange={(v) => set("skipEmpty", v)} label="Skip empty and sticker-only comments" hint="Drops blank comments and media placeholders like [GIF/sticker]." />

            <div className="filter-group">
              <span className="group-label">Comment must include</span>
              <div className="keyword-row">
                <input className="text-input" value={rules.keywords} onChange={(e) => set("keywords", e.target.value)} placeholder="e.g. #giveaway, done" />
                <Segmented
                  label="Keyword match"
                  value={rules.keywordMode}
                  onChange={(v) => set("keywordMode", v)}
                  options={[
                    { value: "any", label: "Any" },
                    { value: "all", label: "All" },
                  ]}
                />
              </div>
              <span className="hint">Separate words with commas. Not case-sensitive. Leave empty to skip.</span>
            </div>

            <div className="filter-group inline">
              <div>
                <span className="group-label">Minimum @mentions</span>
                <span className="hint">For “tag a friend” rules. Counts @username tags only; Facebook exports often drop the @.</span>
              </div>
              <NumberStepper label="Minimum mentions" value={rules.minMentions} min={0} max={20} onChange={(v) => set("minMentions", v)} />
            </div>
          </div>
        </Card>

        <Card icon={<Ban />} tone="coral" title="Exclude people" subtitle="Staff, page admins, past winners… one name or profile link per line.">
          <textarea className="text-input" rows={4} value={rules.excludeList} onChange={(e) => set("excludeList", e.target.value)} placeholder={"https://www.facebook.com/your.page\nTeam Member Name"} />
          {pool.excludeLines > 0 && (
            <p className={`hint ${pool.excludeMatched < pool.excludeLines ? "is-warn" : ""}`}>
              {pool.excludeMatched} of {pluralize(pool.excludeLines, "line")} matched someone in the list.
              {pool.excludeMatched < pool.excludeLines && " Check the spelling of the others."}
            </p>
          )}
        </Card>

        <Card icon={<Sparkle />} tone="sun" title="Draw settings" subtitle="How the big moment plays out.">
          <div className="settings-grid">
            <label className="field wide">
              <span className="field-label">
                <Pencil size={14} /> Giveaway title <em>shown on the machine</em>
              </span>
              <input className="text-input" value={title} maxLength={60} onChange={(e) => onTitle(e.target.value)} placeholder="Giveaway Draw" />
            </label>

            <div className="field">
              <span className="field-label">Number of winners</span>
              <NumberStepper label="Number of winners" value={settings.winnerCount} min={1} max={Math.max(maxWinners, settings.winnerCount)} onChange={(v) => setDraw("winnerCount", v)} />
              {settings.winnerCount > maxWinners && <span className="hint is-warn">Only {pluralize(maxWinners, "person", "people")} can win with these rules.</span>}
            </div>

            <div className="field">
              <span className="field-label">Reveal</span>
              <Segmented<RevealMode>
                label="Reveal style"
                value={settings.mode}
                onChange={(v) => setDraw("mode", v)}
                options={[
                  { value: "one", label: "One by one", icon: <Layers size={16} /> },
                  { value: "all", label: "All at once", icon: <Grid size={16} /> },
                ]}
              />
            </div>

            <div className="field wide">
              <span className="field-label">
                <Zap size={14} /> Suspense
              </span>
              <Segmented<Suspense>
                label="Spin length"
                value={settings.suspense}
                onChange={(v) => setDraw("suspense", v)}
                options={[
                  { value: "quick", label: "Quick · 3s" },
                  { value: "normal", label: "Normal · 6s" },
                  { value: "dramatic", label: "Dramatic · 9s" },
                ]}
              />
            </div>

            <div className="field wide">
              <Toggle checked={settings.allowRepeat} onChange={(v) => setDraw("allowRepeat", v)} label="Same person can win more than once" hint="Off: once someone wins, all their other entries leave the pool." />
              <Toggle checked={settings.sound} onChange={(v) => setDraw("sound", v)} label="Sound effects" hint="Reel ticks, whoosh and a winner fanfare." />
            </div>
          </div>
        </Card>
      </div>

      <aside className="rules-side">
        <div className="card eligible">
          <div className="eligible-top">
            <span className="eyebrow">In the draw</span>
            <div className="eligible-count">
              <AnimatedNumber value={eligible} />
            </div>
            <span className="eligible-unit">{rules.onePerPerson ? (eligible === 1 ? "person" : "people") : eligible === 1 ? "entry" : "entries"}</span>
          </div>

          <div className="funnel">
            <span>{pluralize(pool.totalComments, "comment")}</span>
            <ArrowRight size={14} />
            <span>{pool.matchingComments.toLocaleString()} pass filters</span>
            <ArrowRight size={14} />
            <strong>{pluralize(eligible, "ticket")}</strong>
          </div>
          {eligible > 0 && <p className="odds">Each ticket has a 1 in {eligible.toLocaleString()} chance per draw.</p>}

          <label className="search">
            <Search size={18} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search names or comments" />
          </label>

          <ul className="entrant-list">
            {filtered.slice(0, LIST_LIMIT).map((c) => (
              <li key={c.id} className="entrant">
                <span className="avatar" style={avatarStyle(c.personKey)}>
                  {initials(c.name)}
                </span>
                <span className="entrant-text">
                  <strong>{c.name}</strong>
                  <span>{c.comment || "—"}</span>
                </span>
                <span className="entrant-meta">
                  {c.source && <span className="source-dot" style={platformStyle(c.source)} title={c.source} />}
                  {c.comments > 1 && <span className="count-badge">×{c.comments}</span>}
                </span>
                <button type="button" className="entrant-x" onClick={() => exclude(c)} title="Exclude this person">
                  <Ban size={15} /> Exclude
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="entrant-empty">{eligible ? "No one matches that search." : "Nobody passes these rules yet. Try loosening a filter."}</li>}
            {filtered.length > LIST_LIMIT && <li className="entrant-more">+ {(filtered.length - LIST_LIMIT).toLocaleString()} more · search to find someone</li>}
          </ul>

          {drawnCount > 0 && <p className="hint">{pluralize(drawnCount, "winner")} already drawn. They stay on the winners list.</p>}

          <div className="side-actions">
            <button type="button" className="btn btn-ghost" onClick={onBack}>
              <ArrowLeft size={18} /> Data
            </button>
            <button type="button" className="btn btn-primary btn-xl grow" disabled={!eligible} onClick={onNext}>
              Start the draw <ArrowRight size={22} strokeWidth={2.8} />
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
