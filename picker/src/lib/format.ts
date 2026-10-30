import Papa from "papaparse";
import type { CSSProperties } from "react";
import type { Winner } from "./draw";

const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

export function graphemes(text: string): string[] {
  return Array.from(segmenter.segment(text), (s) => s.segment);
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = (w: string | undefined) => (w ? graphemes(w.replace(/^[@#]/, ""))[0] ?? "" : "");
  return (first(words[0]) + (words.length > 1 ? first(words[words.length - 1]) : "")).toUpperCase() || "?";
}

const AVATAR_COLORS: [string, string][] = [
  ["#6C3BFF", "#fff"],
  ["#FF5C7A", "#fff"],
  ["#22C996", "#17122B"],
  ["#3DB8FF", "#17122B"],
  ["#FFC93C", "#17122B"],
  ["#FF8A3D", "#17122B"],
];

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function avatarStyle(key: string): CSSProperties {
  const [background, color] = AVATAR_COLORS[hash(key) % AVATAR_COLORS.length];
  return { background, color };
}

export function platformStyle(source: string): CSSProperties {
  const s = source.toLowerCase();
  if (s.includes("facebook") || s === "fb") return { background: "#1877F2", color: "#fff" };
  if (s.includes("instagram") || s === "ig") return { background: "linear-gradient(45deg, #F58529, #DD2A7B 55%, #8134AF)", color: "#fff" };
  if (s.includes("youtube")) return { background: "#FF0033", color: "#fff" };
  if (s.includes("tiktok") || s === "x" || s.includes("twitter") || s.includes("threads")) return { background: "#17122B", color: "#fff" };
  return avatarStyle(s);
}

export function pluralize(n: number, one: string, many = `${one}s`) {
  return `${n.toLocaleString()} ${n === 1 ? one : many}`;
}

export function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "giveaway";
}

export function winnersCsv(winners: Winner[]): string {
  let rank = 0;
  return Papa.unparse(
    winners.map((w) => ({
      rank: w.status === "won" ? ++rank : "",
      status: w.status,
      name: w.candidate.name,
      profile_link: w.candidate.profile,
      comment: w.candidate.comment,
      source: w.candidate.source,
      post_url: w.candidate.post,
      drawn_at: w.drawnAt,
      pool_size: w.poolSize,
    })),
  );
}

export function winnersText(title: string, winners: Winner[]): string {
  const active = winners.filter((w) => w.status === "won");
  const lines = active.map((w, i) => `${i + 1}. ${w.candidate.name}${w.candidate.profile ? ` — ${w.candidate.profile}` : ""}`);
  return [`🎉 ${title} — ${active.length === 1 ? "winner" : "winners"}`, "", ...lines].join("\n");
}

export function download(filename: string, content: string, type = "text/csv;charset=utf-8") {
  // The BOM makes Excel open UTF-8 (Devanagari, emoji) correctly.
  const blob = new Blob(["﻿", content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}
