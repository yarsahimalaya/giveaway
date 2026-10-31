import { normalizeName, normalizeProfile, type Entry } from "./entries";

export interface Rules {
  onePerPerson: boolean;
  excludedSources: string[];
  excludedPosts: string[];
  excludedTypes: string[];
  skipEmpty: boolean;
  keywords: string;
  keywordMode: "any" | "all";
  minMentions: number;
  excludeList: string;
}

export const DEFAULT_RULES: Rules = {
  onePerPerson: true,
  excludedSources: [],
  excludedPosts: [],
  excludedTypes: [],
  skipEmpty: false,
  keywords: "",
  keywordMode: "any",
  minMentions: 0,
  excludeList: "",
};

/** One ticket in the draw: a person (one-per-person mode) or a single comment. */
export interface Candidate extends Entry {
  /** How many of this person's comments passed the filters. */
  comments: number;
}

export interface Pool {
  candidates: Candidate[];
  totalComments: number;
  matchingComments: number;
  people: number;
  excludeLines: number;
  excludeMatched: number;
}

const MENTION = /@[\p{L}\p{N}._]+/gu;
// Exports often stand in for media with a bracketed tag such as "[GIF/sticker]".
const PLACEHOLDER_ONLY = /^\[[^\]]*\]$/;

export const mentionCount = (text: string) => text.match(MENTION)?.length ?? 0;

export function parseKeywords(text: string): string[] {
  return text
    .split(",")
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);
}

export function excludeLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export function buildPool(entries: Entry[], rules: Rules): Pool {
  const lines = excludeLines(rules.excludeList);
  const lineKeys = lines.map((line) => ({
    profile: /[./]/.test(line) ? normalizeProfile(line) : "",
    name: normalizeName(line),
  }));
  const blockedProfiles = new Set(lineKeys.map((k) => k.profile).filter(Boolean));
  const blockedNames = new Set(lineKeys.map((k) => k.name));
  const matchedLines = new Set<number>();

  const keywords = parseKeywords(rules.keywords);
  const sources = new Set(rules.excludedSources);
  const posts = new Set(rules.excludedPosts);
  const types = new Set(rules.excludedTypes);

  const matching: Entry[] = [];
  for (const e of entries) {
    const profile = normalizeProfile(e.profile);
    const name = normalizeName(e.name);
    if ((profile && blockedProfiles.has(profile)) || blockedNames.has(name)) {
      lineKeys.forEach((k, i) => {
        if ((k.profile && k.profile === profile) || k.name === name) matchedLines.add(i);
      });
      continue;
    }
    if (e.source && sources.has(e.source)) continue;
    if (e.post && posts.has(e.post)) continue;
    if (e.type && types.has(e.type)) continue;
    const text = e.comment.trim();
    if (rules.skipEmpty && (!text || PLACEHOLDER_ONLY.test(text))) continue;
    if (keywords.length) {
      const lower = text.toLowerCase();
      const hit = rules.keywordMode === "all" ? keywords.every((k) => lower.includes(k)) : keywords.some((k) => lower.includes(k));
      if (!hit) continue;
    }
    if (rules.minMentions > 0 && mentionCount(text) < rules.minMentions) continue;
    matching.push(e);
  }

  const perPerson = new Map<string, number>();
  for (const e of matching) perPerson.set(e.personKey, (perPerson.get(e.personKey) ?? 0) + 1);

  let candidates: Candidate[];
  if (rules.onePerPerson) {
    const seen = new Set<string>();
    candidates = [];
    for (const e of matching) {
      if (seen.has(e.personKey)) continue;
      seen.add(e.personKey);
      candidates.push({ ...e, comments: perPerson.get(e.personKey) ?? 1 });
    }
  } else {
    candidates = matching.map((e) => ({ ...e, comments: perPerson.get(e.personKey) ?? 1 }));
  }

  return {
    candidates,
    totalComments: entries.length,
    matchingComments: matching.length,
    people: perPerson.size,
    excludeLines: lines.length,
    excludeMatched: matchedLines.size,
  };
}
