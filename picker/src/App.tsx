import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { Backdrop } from "./components/Backdrop";
import { DrawStep } from "./components/DrawStep";
import { Header } from "./components/Header";
import { RulesStep } from "./components/RulesStep";
import { UploadStep } from "./components/UploadStep";
import { EMPTY_MAPPING, mergeMapping, type ColumnMapping, type LoadedFile } from "./lib/csv";
import { DEFAULT_SETTINGS, type DrawSettings, type Winner } from "./lib/draw";
import { buildEntries, computeFacets } from "./lib/entries";
import { buildPool, DEFAULT_RULES, type Rules } from "./lib/rules";
import { setSoundEnabled } from "./lib/sound";
import { clearState, loadState, saveState, type Step } from "./lib/storage";

const DEFAULT_TITLE = "Giveaway Draw";

const page = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, y: -18, transition: { duration: 0.2 } },
};

export default function App() {
  const [saved] = useState(loadState);
  const [title, setTitle] = useState(saved.title ?? DEFAULT_TITLE);
  const [files, setFiles] = useState<LoadedFile[]>(saved.files ?? []);
  const [mapping, setMapping] = useState<ColumnMapping>(saved.mapping ?? EMPTY_MAPPING);
  const [rules, setRules] = useState<Rules>({ ...DEFAULT_RULES, ...saved.rules });
  const [settings, setSettings] = useState<DrawSettings>({ ...DEFAULT_SETTINGS, ...saved.settings });
  const [winners, setWinners] = useState<Winner[]>(saved.winners ?? []);
  const [step, setStep] = useState<Step>(saved.files?.length ? (saved.step ?? "rules") : "upload");

  const entries = useMemo(() => buildEntries(files, mapping), [files, mapping]);
  const facets = useMemo(() => computeFacets(entries), [entries]);
  const pool = useMemo(() => buildPool(entries, rules), [entries, rules]);

  const enabled: Record<Step, boolean> = {
    upload: true,
    rules: entries.length > 0,
    draw: pool.candidates.length > 0,
  };
  const currentStep = enabled[step] ? step : "upload";

  useEffect(() => {
    const t = setTimeout(() => saveState({ title, files, mapping, rules, settings, winners, step: currentStep }), 300);
    return () => clearTimeout(t);
  }, [title, files, mapping, rules, settings, winners, currentStep]);

  useEffect(() => setSoundEnabled(settings.sound), [settings.sound]);

  // Dropping a file anywhere outside the drop zone shouldn't navigate away from the page.
  useEffect(() => {
    const stop = (e: DragEvent) => e.preventDefault();
    window.addEventListener("dragover", stop);
    window.addEventListener("drop", stop);
    return () => {
      window.removeEventListener("dragover", stop);
      window.removeEventListener("drop", stop);
    };
  }, []);

  const addFiles = (added: LoadedFile[]) => {
    const next = [...files.filter((f) => !added.some((a) => a.name === f.name)), ...added];
    setFiles(next);
    setMapping(mergeMapping(mapping, next));
  };

  const removeFile = (id: string) => {
    const next = files.filter((f) => f.id !== id);
    setFiles(next);
    setMapping(next.length ? mergeMapping(mapping, next) : EMPTY_MAPPING);
  };

  const reset = () => {
    clearState();
    setTitle(DEFAULT_TITLE);
    setFiles([]);
    setMapping(EMPTY_MAPPING);
    setRules(DEFAULT_RULES);
    setSettings(DEFAULT_SETTINGS);
    setWinners([]);
    setStep("upload");
  };

  const goTo = (s: Step) => {
    setStep(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={`app step-${currentStep}`}>
      <Backdrop />
      <Header step={currentStep} enabled={enabled} onStep={goTo} onReset={reset} hasData={files.length > 0 || winners.length > 0} />
      <main className="main">
        <AnimatePresence mode="wait">
          <motion.div key={currentStep} className="page" {...page}>
            {currentStep === "upload" && (
              <UploadStep
                files={files}
                mapping={mapping}
                entries={entries}
                facets={facets}
                onAddFiles={addFiles}
                onRemoveFile={removeFile}
                onMapping={setMapping}
                onNext={() => goTo("rules")}
              />
            )}
            {currentStep === "rules" && (
              <RulesStep
                title={title}
                onTitle={setTitle}
                facets={facets}
                rules={rules}
                onRules={setRules}
                settings={settings}
                onSettings={setSettings}
                pool={pool}
                drawnCount={winners.filter((w) => w.status === "won").length}
                onBack={() => goTo("upload")}
                onNext={() => goTo("draw")}
              />
            )}
            {currentStep === "draw" && (
              <DrawStep
                title={title.trim() || DEFAULT_TITLE}
                pool={pool.candidates}
                settings={settings}
                onSettings={setSettings}
                winners={winners}
                onWinners={setWinners}
                onEditRules={() => goTo("rules")}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
