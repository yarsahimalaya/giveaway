import type { ColumnMapping, LoadedFile } from "./csv";

export interface Entry {
  id: string;
  personKey: string;
  name: string;
  profile: string;
  comment: string;
  source: string;
  post: string;
  type: string;
}

export interface Facet {
  value: string;
  count: number;
}

export interface Facets {
  sources: Facet[];
  posts: Facet[];
  types: Facet[];
}

export function normalizeName(name: string): string {
  return name.normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Reduces a profile URL to host + path so http/https, www./m. and tracking
 * params don't make one person look like two. Facebook's profile.php?id=
 * links keep their id, since that is the only thing identifying them.
 */
export function normalizeProfile(link: string): string {
  const raw = link.trim();
  if (!raw) return "";
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
    const host = url.hostname.toLowerCase().replace(/^(www|m|web|mobile)\./, "");
    const path = url.pathname.replace(/\/+$/, "").toLowerCase();
    const id = url.searchParams.get("id");
    return host + path + (id ? `?id=${id}` : "");
  } catch {
    return raw.toLowerCase();
  }
}

export function personKey(name: string, profile: string): string {
  const p = normalizeProfile(profile);
  return p ? `p:${p}` : `n:${normalizeName(name)}`;
}

export function buildEntries(files: LoadedFile[], mapping: ColumnMapping): Entry[] {
  if (!mapping.name) return [];
  const entries: Entry[] = [];
  const pick = (row: Record<string, string>, column: string | null) => (column ? (row[column] ?? "").trim() : "");
  for (const file of files) {
    // Without a platform column, the file name is the most useful stand-in when several files are loaded.
    const fallbackSource = files.length > 1 ? file.name.replace(/\.[^.]+$/, "") : "";
    file.rows.forEach((row, index) => {
      const name = pick(row, mapping.name);
      const profile = pick(row, mapping.profile);
      if (!name && !profile) return;
      entries.push({
        id: `${file.id}:${index}`,
        personKey: personKey(name, profile),
        name: name || profile,
        profile,
        comment: pick(row, mapping.comment),
        source: pick(row, mapping.source) || fallbackSource,
        post: pick(row, mapping.post),
        type: pick(row, mapping.type),
      });
    });
  }
  return entries;
}

function countBy(entries: Entry[], key: "source" | "post" | "type"): Facet[] {
  const counts = new Map<string, number>();
  for (const e of entries) {
    if (e[key]) counts.set(e[key], (counts.get(e[key]) ?? 0) + 1);
  }
  return [...counts].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count);
}

export function computeFacets(entries: Entry[]): Facets {
  return {
    sources: countBy(entries, "source"),
    posts: countBy(entries, "post"),
    types: countBy(entries, "type"),
  };
}

export function shortUrl(url: string): string {
  const s = url.replace(/^[a-z]+:\/\//i, "").replace(/^www\./, "").replace(/\/+$/, "");
  return s.length > 34 ? `${s.slice(0, 22)}…${s.slice(-10)}` : s;
}
