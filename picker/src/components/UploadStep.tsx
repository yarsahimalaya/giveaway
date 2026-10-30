import { AnimatePresence, motion } from "motion/react";
import { useRef, useState, type DragEvent } from "react";
import { allHeaders, FIELDS, namesToFile, parseCsvFile, type ColumnMapping, type LoadedFile } from "../lib/csv";
import type { Entry, Facets } from "../lib/entries";
import { pluralize } from "../lib/format";
import { sfx } from "../lib/sound";
import { ArrowRight, Clipboard, Close, FileText, Settings, Upload } from "./icons";
import { AnimatedNumber, Card } from "./ui";

interface UploadStepProps {
  files: LoadedFile[];
  mapping: ColumnMapping;
  entries: Entry[];
  facets: Facets;
  onAddFiles: (files: LoadedFile[]) => void;
  onRemoveFile: (id: string) => void;
  onMapping: (m: ColumnMapping) => void;
  onNext: () => void;
}

const BUBBLES = [
  { text: "Count me in! 🙌", x: "2%", y: "6%", r: -6, d: 0 },
  { text: "@bestie let’s win this", x: "38%", y: "40%", r: 4, d: 0.8 },
  { text: "Done ✅ followed + liked", x: "6%", y: "72%", r: -3, d: 1.6 },
];

function HeroArt() {
  return (
    <div className="hero-art" aria-hidden="true">
      {BUBBLES.map((b, i) => (
        <motion.div
          key={i}
          className={`bubble bubble-${i}`}
          style={{ left: b.x, top: b.y, rotate: b.r }}
          initial={{ opacity: 0, scale: 0.5, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.3 + b.d * 0.3, type: "spring", stiffness: 260, damping: 16 }}
        >
          <span className="bubble-avatar" />
          {b.text}
        </motion.div>
      ))}
      <motion.div className="hero-trophy" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 8 }} transition={{ delay: 0.9, type: "spring", stiffness: 300, damping: 12 }}>
        <svg viewBox="0 0 64 64">
          <path d="M20 8h24v14a12 12 0 0 1-24 0z" fill="var(--sun)" stroke="var(--ink)" strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M20 12h-8v4a9 9 0 0 0 9 9M44 12h8v4a9 9 0 0 1-9 9" fill="none" stroke="var(--ink)" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M32 34v10M22 56h20l-2-8H24z" fill="var(--violet)" stroke="var(--ink)" strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M27 15l2 4 4 .5-3 3 .8 4.2L27 24.6l-3.8 2.1.8-4.2-3-3 4-.5z" fill="#fff" />
        </svg>
      </motion.div>
    </div>
  );
}

export function UploadStep({ files, mapping, entries, facets, onAddFiles, onRemoveFile, onMapping, onNext }: UploadStepProps) {
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const depth = useRef(0);

  const headers = allHeaders(files);
  const people = new Set(entries.map((e) => e.personKey)).size;
  const hasFiles = files.length > 0;

  async function handleFiles(list: FileList | File[]) {
    const picked = Array.from(list);
    if (!picked.length) return;
    setBusy(true);
    setErrors([]);
    const results = await Promise.allSettled(picked.map(parseCsvFile));
    const ok: LoadedFile[] = [];
    const errs: string[] = [];
    results.forEach((r, i) => {
      if (r.status === "fulfilled") ok.push(r.value);
      else errs.push(`${picked[i].name}: ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`);
    });
    if (ok.length) {
      onAddFiles(ok);
      sfx.pop();
    }
    setErrors(errs);
    setBusy(false);
  }

  const onDrag = (e: DragEvent, kind: "enter" | "leave" | "over") => {
    e.preventDefault();
    if (kind === "enter") depth.current += 1;
    if (kind === "leave") depth.current -= 1;
    setDragging(depth.current > 0);
  };

  const sample = (column: string | null) => {
    if (!column) return "";
    for (const f of files) {
      const v = f.rows.find((r) => r[column])?.[column];
      if (v) return v.length > 38 ? `${v.slice(0, 38)}…` : v;
    }
    return "";
  };

  return (
    <div className={`upload ${hasFiles ? "has-files" : ""}`}>
      <section className="hero">
        <div className="hero-copy">
          <motion.span className="eyebrow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            Step 1 · Bring your comments
          </motion.span>
          <h1>
            Let’s find your <mark className="highlight">lucky</mark> winner.
          </h1>
          <p className="lead">Drop in the comment export from your giveaway post. Facebook, Instagram, YouTube, or any CSV with a name column works. You set the rules, we spin the reel.</p>
        </div>
        {!hasFiles && <HeroArt />}
      </section>

      <div className="upload-grid">
        <div className="upload-left">
          <motion.div
            className={`dropzone ${dragging ? "is-dragging" : ""} ${busy ? "is-busy" : ""}`}
            onDragEnter={(e) => onDrag(e, "enter")}
            onDragLeave={(e) => onDrag(e, "leave")}
            onDragOver={(e) => onDrag(e, "over")}
            onDrop={(e) => {
              e.preventDefault();
              depth.current = 0;
              setDragging(false);
              void handleFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), inputRef.current?.click())}
            role="button"
            tabIndex={0}
            animate={{ scale: dragging ? 1.025 : 1, rotate: dragging ? -0.6 : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.tsv,.txt,text/csv"
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files) void handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <div className="drop-icon">
              <Upload size={30} strokeWidth={2.6} />
            </div>
            <strong>{dragging ? "Let go — we’ve got it!" : hasFiles ? "Add another CSV" : "Drop your CSV here"}</strong>
            <span>
              or <u>browse files</u> · you can add several (e.g. Facebook + Instagram)
            </span>
          </motion.div>

          <AnimatePresence>
            {errors.map((err) => (
              <motion.p key={err} className="error-note" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: [0, -6, 6, -3, 0] }} exit={{ opacity: 0 }}>
                Couldn’t read {err}
              </motion.p>
            ))}
          </AnimatePresence>

          <div className="paste">
            <button type="button" className="link-btn" onClick={() => setPasteOpen((o) => !o)}>
              <Clipboard size={16} /> {pasteOpen ? "Hide name list" : "No CSV? Paste a list of names instead"}
            </button>
            <AnimatePresence initial={false}>
              {pasteOpen && (
                <motion.div className="paste-box" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder={"One name per line\nAarav Sharma\nSita Gurung\n…"} rows={5} />
                  <button
                    type="button"
                    className="btn btn-dark btn-sm"
                    disabled={!pasteText.trim()}
                    onClick={() => {
                      const file = namesToFile(pasteText);
                      if (file) {
                        onAddFiles([file]);
                        sfx.pop();
                        setPasteText("");
                        setPasteOpen(false);
                      }
                    }}
                  >
                    Use these names
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence initial={false}>
            {files.map((f) => (
              <motion.div
                key={f.id}
                className="file-chip"
                layout
                initial={{ opacity: 0, y: 16, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 420, damping: 26 }}
              >
                <span className="file-icon">
                  <FileText size={20} />
                </span>
                <span className="file-text">
                  <strong>{f.name}</strong>
                  <span>
                    {pluralize(f.rows.length, "row")} · {pluralize(f.headers.length, "column")}
                  </span>
                </span>
                <button type="button" className="icon-btn" onClick={() => onRemoveFile(f.id)} aria-label={`Remove ${f.name}`}>
                  <Close size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {hasFiles && (
            <motion.div
              className="upload-right"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
            >
              <div className="stat-row">
                {[
                  { label: entries.length === 1 ? "comment" : "comments", value: entries.length, tone: "violet" },
                  { label: people === 1 ? "person" : "people", value: people, tone: "coral" },
                  { label: facets.sources.length === 1 ? "platform" : "platforms", value: facets.sources.length, tone: "mint" },
                  { label: facets.posts.length === 1 ? "post" : "posts", value: facets.posts.length, tone: "sky" },
                ].map((s, i) => (
                  <motion.div key={s.tone} className={`stat tone-${s.tone}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}>
                    <AnimatedNumber value={s.value} className="stat-value" />
                    <span className="stat-label">{s.label}</span>
                  </motion.div>
                ))}
              </div>

              <Card icon={<Settings />} tone="sky" title="Columns" subtitle="We matched these automatically. Change any that look wrong.">
                <div className="mapping-grid">
                  {FIELDS.map((f) => (
                    <label key={f.key} className={`field ${f.required && !mapping[f.key] ? "is-missing" : ""}`}>
                      <span className="field-label">
                        {f.label}
                        {f.required && <em>required</em>}
                      </span>
                      <select value={mapping[f.key] ?? ""} onChange={(e) => onMapping({ ...mapping, [f.key]: e.target.value || null })}>
                        <option value="">— Not in file —</option>
                        {headers.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                      <span className="field-sample">{sample(mapping[f.key]) || f.hint}</span>
                    </label>
                  ))}
                </div>
              </Card>

              <button type="button" className="btn btn-primary btn-xl" disabled={!mapping.name || !entries.length} onClick={onNext}>
                Set the rules <ArrowRight size={22} strokeWidth={2.8} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
