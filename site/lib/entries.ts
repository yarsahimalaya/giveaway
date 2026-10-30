import Papa from "papaparse";

// One row of a giveaway CSV. Only commenter_name and profile_link are required;
// the other columns match the exports in ../oct-2026-giveaway/comments.csv.
export type Entry = {
  commenter_name: string;
  profile_link: string;
  comment: string;
  source: string;
  post_url: string;
  type: string;
  file: string;
};

export async function parseCsv(file: File): Promise<Entry[]> {
  const text = (await file.text()).replace(/^﻿/, "");
  const { data, errors } = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });
  if (errors.length && !data.length) throw new Error(`${file.name}: ${errors[0].message}`);
  const fields = Object.keys(data[0] ?? {});
  for (const col of ["commenter_name", "profile_link"]) {
    if (!fields.includes(col)) throw new Error(`${file.name}: missing "${col}" column`);
  }
  return data
    .filter((r) => r.profile_link?.trim())
    .map((r) => ({
      commenter_name: r.commenter_name?.trim() ?? "",
      profile_link: r.profile_link.trim(),
      comment: r.comment ?? "",
      source: r.source ?? "",
      post_url: r.post_url ?? "",
      type: r.type || "comment",
      file: file.name,
    }));
}

export type Filters = { includeReplies: boolean; onePerPerson: boolean };

// Returns the pool of entries eligible to win. With onePerPerson, each profile
// keeps a single entry so people who commented many times don't get extra odds.
export function eligible(entries: Entry[], { includeReplies, onePerPerson }: Filters): Entry[] {
  const pool = includeReplies ? entries : entries.filter((e) => e.type !== "reply");
  if (!onePerPerson) return pool;
  const seen = new Map<string, Entry>();
  for (const e of pool) {
    const key = e.profile_link.toLowerCase().replace(/\/+$/, "");
    if (!seen.has(key)) seen.set(key, e);
  }
  return [...seen.values()];
}

// Unbiased random integer in [0, max) from the browser's CSPRNG.
function randomInt(max: number): number {
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf);
  while (buf[0] >= limit);
  return buf[0] % max;
}

// Partial Fisher–Yates shuffle: picks `count` distinct entries.
export function pickWinners<T>(pool: T[], count: number): T[] {
  const arr = [...pool];
  const n = Math.min(count, arr.length);
  for (let i = 0; i < n; i++) {
    const j = i + randomInt(arr.length - i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}
