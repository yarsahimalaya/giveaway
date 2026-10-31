import type { Candidate } from "./rules";

export type RevealMode = "one" | "all";
export type Suspense = "quick" | "normal" | "dramatic";

export interface DrawSettings {
  winnerCount: number;
  mode: RevealMode;
  suspense: Suspense;
  allowRepeat: boolean;
  sound: boolean;
}

export const DEFAULT_SETTINGS: DrawSettings = {
  winnerCount: 1,
  mode: "one",
  suspense: "normal",
  allowRepeat: false,
  sound: true,
};

export const SUSPENSE_MS: Record<Suspense, number> = {
  quick: 3200,
  normal: 5600,
  dramatic: 9000,
};

export interface Winner {
  candidate: Candidate;
  round: number;
  drawnAt: string;
  poolSize: number;
  status: "won" | "disqualified";
}

/** Uniform integer in [0, max) from the Web Crypto CSPRNG, without modulo bias. */
export function secureRandomInt(max: number): number {
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf);
  while (buf[0] >= limit);
  return buf[0] % max;
}

/**
 * Picks `count` winners without replacement. Unless repeats are allowed, a
 * pick removes every other ticket belonging to the same person.
 */
export function pickWinners(pool: Candidate[], count: number, allowRepeat: boolean): Candidate[] {
  let remaining = pool.slice();
  const picks: Candidate[] = [];
  while (picks.length < count && remaining.length) {
    const pick = remaining[secureRandomInt(remaining.length)];
    picks.push(pick);
    remaining = remaining.filter((c) => (allowRepeat ? c.id !== pick.id : c.personKey !== pick.personKey));
  }
  return picks;
}

/** Tickets still in play once earlier winners and disqualified people are taken out. */
export function availablePool(pool: Candidate[], winners: Winner[], allowRepeat: boolean): Candidate[] {
  const wonIds = new Set(winners.map((w) => w.candidate.id));
  const out = new Set(winners.filter((w) => w.status === "disqualified" || !allowRepeat).map((w) => w.candidate.personKey));
  return pool.filter((c) => !wonIds.has(c.id) && !out.has(c.personKey));
}
