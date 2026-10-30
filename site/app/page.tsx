"use client";

import { useMemo, useState } from "react";
import { eligible, parseCsv, pickWinners, type Entry } from "@/lib/entries";

export default function Home() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [count, setCount] = useState(1);
  const [includeReplies, setIncludeReplies] = useState(false);
  const [onePerPerson, setOnePerPerson] = useState(true);
  const [winners, setWinners] = useState<Entry[]>([]);

  const pool = useMemo(
    () => eligible(entries, { includeReplies, onePerPerson }),
    [entries, includeReplies, onePerPerson],
  );

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    setError("");
    setWinners([]);
    try {
      const parsed = await Promise.all([...list].map(parseCsv));
      setEntries(parsed.flat());
      setFiles([...list].map((f) => f.name));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const canDraw = pool.length > 0 && count >= 1;

  return (
    <main>
      <h1>Giveaway Picker</h1>
      <p className="muted">
        Upload one or more comment CSVs (columns: <code>commenter_name</code>, <code>profile_link</code>, and
        optionally <code>comment</code>, <code>source</code>, <code>post_url</code>, <code>type</code>). Files stay in
        your browser; nothing is uploaded to a server.
      </p>

      <section className="card">
        <label className="field">
          <span>CSV files</span>
          <input type="file" accept=".csv,text/csv" multiple onChange={(e) => onFiles(e.target.files)} />
        </label>
        {error && <p className="error">{error}</p>}
        {files.length > 0 && (
          <p className="muted">
            {entries.length} rows from {files.join(", ")} · <strong>{pool.length}</strong> eligible
          </p>
        )}

        <div className="row">
          <label className="field">
            <span>Number of winners</span>
            <input
              type="number"
              min={1}
              max={Math.max(1, pool.length)}
              value={count}
              onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
            />
          </label>
          <label className="check">
            <input type="checkbox" checked={onePerPerson} onChange={(e) => setOnePerPerson(e.target.checked)} />
            One entry per person
          </label>
          <label className="check">
            <input type="checkbox" checked={includeReplies} onChange={(e) => setIncludeReplies(e.target.checked)} />
            Include replies
          </label>
        </div>

        <button disabled={!canDraw} onClick={() => setWinners(pickWinners(pool, count))}>
          {winners.length ? "Draw again" : "Draw winners"}
        </button>
      </section>

      {winners.length > 0 && (
        <section>
          <h2>
            Winners <span className="muted">({winners.length})</span>
          </h2>
          <ol className="winners">
            {winners.map((w) => (
              <li key={w.profile_link + w.comment}>
                <a href={w.profile_link} target="_blank" rel="noreferrer">
                  {w.commenter_name || w.profile_link}
                </a>
                {w.source && <span className="tag">{w.source}</span>}
                {w.comment && <p className="muted">{w.comment}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
  );
}
