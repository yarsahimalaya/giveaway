import Papa from "papaparse";

export type Row = Record<string, string>;

export interface LoadedFile {
  id: string;
  name: string;
  headers: string[];
  rows: Row[];
}

export type Field = "name" | "profile" | "comment" | "source" | "post" | "type";
export type ColumnMapping = Record<Field, string | null>;

export const FIELDS: { key: Field; label: string; hint: string; required?: boolean }[] = [
  { key: "name", label: "Name", hint: "Shown on the reel and announced", required: true },
  { key: "profile", label: "Profile link", hint: "Best way to spot repeat commenters" },
  { key: "comment", label: "Comment", hint: "Used by keyword and sticker filters" },
  { key: "source", label: "Platform", hint: "Facebook, Instagram, …" },
  { key: "post", label: "Post", hint: "Which post the comment is on" },
  { key: "type", label: "Comment type", hint: "Comment or reply" },
];

export const EMPTY_MAPPING: ColumnMapping = {
  name: null,
  profile: null,
  comment: null,
  source: null,
  post: null,
  type: null,
};

// Header spellings we recognise, compared after lowercasing and stripping punctuation.
const CANDIDATES: Record<Field, string[]> = {
  name: ["commentername", "name", "username", "fullname", "displayname", "authorname", "author", "commenter", "ownerusername", "profilename", "user", "from"],
  profile: ["profilelink", "profileurl", "profile", "userlink", "userurl", "authorurl", "authorlink", "ownerprofileurl", "link", "url"],
  comment: ["comment", "commenttext", "text", "message", "body", "content"],
  source: ["source", "platform", "network", "site", "channel"],
  post: ["posturl", "postlink", "post", "permalink", "mediaurl", "postid", "media"],
  type: ["type", "commenttype", "kind"],
};

// Post columns are claimed before profile ones so "post_url" never becomes the profile link.
const DETECT_ORDER: Field[] = ["name", "comment", "post", "profile", "source", "type"];

const squash = (header: string) => header.toLowerCase().replace(/[^a-z0-9]/g, "");

export function detectMapping(headers: string[]): ColumnMapping {
  const mapping = { ...EMPTY_MAPPING };
  const used = new Set<string>();
  const claim = (field: Field, match: (h: string, c: string) => boolean) => {
    if (mapping[field]) return;
    for (const candidate of CANDIDATES[field]) {
      const header = headers.find((h) => !used.has(h) && match(squash(h), candidate));
      if (header) {
        mapping[field] = header;
        used.add(header);
        return;
      }
    }
  };
  for (const field of DETECT_ORDER) claim(field, (h, c) => h === c);
  for (const field of DETECT_ORDER) claim(field, (h, c) => c.length >= 4 && h.includes(c));
  return mapping;
}

export function allHeaders(files: LoadedFile[]): string[] {
  return [...new Set(files.flatMap((f) => f.headers))];
}

/** Keep the user's column choices that still exist, and auto-detect the rest. */
export function mergeMapping(current: ColumnMapping, files: LoadedFile[]): ColumnMapping {
  const headers = allHeaders(files);
  const detected = detectMapping(headers);
  const next = { ...EMPTY_MAPPING };
  for (const { key } of FIELDS) {
    const mine = current[key];
    next[key] = mine && headers.includes(mine) ? mine : detected[key];
  }
  return next;
}

export function parseCsvFile(file: File): Promise<LoadedFile> {
  return new Promise((resolve, reject) => {
    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.replace(/^﻿/, "").trim(),
      transform: (value) => (typeof value === "string" ? value.trim() : value),
      complete: (result) => {
        const headers = (result.meta.fields ?? []).filter(Boolean);
        const rows = result.data.filter((row) => row && typeof row === "object");
        if (!headers.length || !rows.length) {
          reject(new Error("no rows found — is this a CSV with a header row?"));
          return;
        }
        resolve({ id: crypto.randomUUID(), name: file.name, headers, rows });
      },
      error: (err) => reject(err),
    });
  });
}

/** Turns a pasted list (one name per line) into a file-shaped object. */
export function namesToFile(text: string): LoadedFile | null {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((name) => ({ name }));
  if (!rows.length) return null;
  return { id: crypto.randomUUID(), name: "Pasted names", headers: ["name"], rows };
}
