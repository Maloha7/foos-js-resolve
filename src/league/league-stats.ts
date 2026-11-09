/**
 * League-wide player career stats — pure aggregation over match results.
 *
 * The app tracks rankings per *season* (`SeasonRanks`). These helpers roll a
 * single player's results up across every season in a league into a career
 * card: totals, best/worst partner, and nemeses. They are deliberately pure and
 * immutable so they can be unit-tested in isolation and folded from either the
 * event store or in-memory fixtures.
 *
 * Data source: the `SEASON_MATCH_REGISTERED` event (`{ winners, losers }`),
 * which covers both 1v1 (one id per side) and 2v2 (two ids per side). Teammates
 * therefore only accrue in 2v2 play; a singles-only league yields no partner.
 *
 * Best/worst teammate and nemeses are ranked by a Laplace-smoothed win/loss
 * ratio among pairings that clear a minimum-games gate — both knobs are tunable
 * (see `RankingOptions` / `rankingOptionsFromEnv`). Each record still carries
 * the full, unsmoothed win/loss tally so the card can display the pairing's
 * real win/loss ratio.
 */

/** A player's head-to-head record with a partner or opponent (from the subject
 * player's perspective: `won`/`lost` are the subject's wins/losses). */
export interface HeadToHead {
  playerId: string;
  won: number;
  lost: number;
}

export type TeammateStat = HeadToHead;
export type NemesisStat = HeadToHead;

export interface PlayerLeagueStats {
  leagueId: string;
  playerId: string;
  played: number;
  won: number;
  lost: number;
  /** Highest season-final rank reached in any season; null if never played. */
  highScore: number | null;
  /** Lowest season-final rank reached in any season; null if never played. */
  lowScore: number | null;
  seasonsWon: number;
  /** Partner with the most shared wins; null in singles-only play. */
  bestTeammate: TeammateStat | null;
  /** Partner with the most shared losses; null in singles-only play. */
  worstTeammate: TeammateStat | null;
  /** Opponents the player has lost to, ordered by losses-against descending. */
  nemeses: NemesisStat[];
}

/**
 * Running accumulator folded over every match in the league. Partner and
 * opponent tallies are keyed by player id for O(1) updates; `finalizeStats`
 * collapses them into the public shape.
 */
export interface StatsAccumulator {
  played: number;
  won: number;
  lost: number;
  teammates: Record<string, HeadToHead>;
  opponents: Record<string, HeadToHead>;
  /** One entry per season the player actually appeared in. */
  seasonFinalRanks: number[];
  seasonsWon: number;
}

const emptyAccumulator = (): StatsAccumulator => ({
  played: 0,
  won: 0,
  lost: 0,
  teammates: {},
  opponents: {},
  seasonFinalRanks: [],
  seasonsWon: 0,
});

export const emptyPlayerLeagueStats = (
  leagueId: string,
  playerId: string,
): PlayerLeagueStats => ({
  leagueId,
  playerId,
  played: 0,
  won: 0,
  lost: 0,
  highScore: null,
  lowScore: null,
  seasonsWon: 0,
  bestTeammate: null,
  worstTeammate: null,
  nemeses: [],
});

interface MatchResult {
  winners: string[];
  losers: string[];
}

/** Increment `won` or `lost` for each of `ids` in a head-to-head record map. */
const bumpRecords = (
  records: Record<string, HeadToHead>,
  ids: string[],
  outcome: 'won' | 'lost',
): Record<string, HeadToHead> =>
  ids.reduce((acc, id) => {
    const prev = acc[id] ?? { playerId: id, won: 0, lost: 0 };
    return { ...acc, [id]: { ...prev, [outcome]: prev[outcome] + 1 } };
  }, records);

/**
 * Fold a single match into the accumulator from `playerId`'s perspective.
 * Matches the player did not take part in are returned unchanged.
 */
export const accumulateMatch = (
  acc: StatsAccumulator,
  playerId: string,
  { winners, losers }: MatchResult,
): StatsAccumulator => {
  const won = winners.includes(playerId);
  const lost = losers.includes(playerId);
  if (!won && !lost) return acc;

  if (won) {
    return {
      ...acc,
      played: acc.played + 1,
      won: acc.won + 1,
      teammates: bumpRecords(
        acc.teammates,
        winners.filter((id) => id !== playerId),
        'won',
      ),
      // The player beat these opponents this match.
      opponents: bumpRecords(acc.opponents, losers, 'won'),
    };
  }

  return {
    ...acc,
    played: acc.played + 1,
    lost: acc.lost + 1,
    teammates: bumpRecords(
      acc.teammates,
      losers.filter((id) => id !== playerId),
      'lost',
    ),
    // These opponents beat the player this match.
    opponents: bumpRecords(acc.opponents, winners, 'lost'),
  };
};

/** Record the player's final rank for one season (skip seasons never played). */
export const withSeasonFinalRank = (
  acc: StatsAccumulator,
  rank: number | undefined,
): StatsAccumulator =>
  rank === undefined
    ? acc
    : { ...acc, seasonFinalRanks: [...acc.seasonFinalRanks, rank] };

export const withSeasonWinner = (
  acc: StatsAccumulator,
  playerId: string,
  winnerId: string | undefined,
): StatsAccumulator =>
  winnerId === playerId ? { ...acc, seasonsWon: acc.seasonsWon + 1 } : acc;

export const initialStatsAccumulator = emptyAccumulator;

/**
 * How best/worst teammate and nemeses are ranked. Two knobs, both tunable via
 * env (see `rankingOptionsFromEnv`) so they can be dialled against real data:
 *
 *  - `minMatches`: a pairing must have at least this many games (together, or
 *    against) to be ranked at all — a sample-size floor that keeps one-off
 *    pairings out of the card.
 *  - `smoothing`: Laplace strength `k` added to both tallies before dividing,
 *    so among the eligible a tiny record can't produce an extreme ratio (a 5-0
 *    doesn't automatically top a 40-8). `k = 0` gives the raw ratio.
 */
export interface RankingOptions {
  minMatches: number;
  smoothing: number;
}

export const DEFAULT_RANKING_OPTIONS: RankingOptions = {
  minMatches: 5,
  smoothing: 1,
};

/** Env override names for the two ranking knobs. */
export const RANKING_ENV = {
  minMatches: 'CAREER_STATS_MIN_MATCHES',
  smoothing: 'CAREER_STATS_SMOOTHING',
} as const;

const parseNonNegative = (
  value: string | undefined,
  fallback: number,
): number => {
  if (value === undefined || value.trim() === '') return fallback;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return n;
};

/**
 * Resolve ranking options from the environment, falling back to defaults. Pure
 * in `env` (defaults to `process.env`) so it can be unit-tested directly.
 */
export const rankingOptionsFromEnv = (
  env: NodeJS.ProcessEnv = process.env,
): RankingOptions => ({
  minMatches: parseNonNegative(
    env[RANKING_ENV.minMatches],
    DEFAULT_RANKING_OPTIONS.minMatches,
  ),
  smoothing: parseNonNegative(
    env[RANKING_ENV.smoothing],
    DEFAULT_RANKING_OPTIONS.smoothing,
  ),
});

const encounters = (r: HeadToHead): number => r.won + r.lost;

// Laplace-smoothed win/loss ratios with strength `k`. Used ONLY to order
// records — the returned HeadToHead keeps the real, unsmoothed counts.
const winRatio = (r: HeadToHead, k: number): number =>
  (r.won + k) / (r.lost + k);
const lossRatio = (r: HeadToHead, k: number): number =>
  (r.lost + k) / (r.won + k);

/** Order by `score` desc, breaking ties toward the larger sample then id, so
 *  ratio ties resolve deterministically to the better-established pairing. */
const byScoreDesc =
  (score: (r: HeadToHead) => number) =>
  (a: HeadToHead, b: HeadToHead): number =>
    score(b) - score(a) ||
    encounters(b) - encounters(a) ||
    a.playerId.localeCompare(b.playerId);

/** Highest-scoring eligible record; null if none. */
const topByScore = (
  records: Record<string, HeadToHead>,
  eligible: (r: HeadToHead) => boolean,
  score: (r: HeadToHead) => number,
): HeadToHead | null =>
  Object.values(records).filter(eligible).sort(byScoreDesc(score))[0] ?? null;

/** Collapse the accumulator into the public career-card shape. */
export const finalizeStats = (
  leagueId: string,
  playerId: string,
  acc: StatsAccumulator,
  options: RankingOptions = DEFAULT_RANKING_OPTIONS,
): PlayerLeagueStats => {
  const { minMatches, smoothing } = options;
  const ranks = acc.seasonFinalRanks;
  const enoughGames = (r: HeadToHead): boolean => encounters(r) >= minMatches;
  return {
    leagueId,
    playerId,
    played: acc.played,
    won: acc.won,
    lost: acc.lost,
    highScore: ranks.length ? Math.max(...ranks) : null,
    lowScore: ranks.length ? Math.min(...ranks) : null,
    seasonsWon: acc.seasonsWon,
    // Rank by the smoothed ratio among pairings that clear the match-count
    // gate; the records themselves carry the true counts so the UI shows real
    // W/L.
    bestTeammate: topByScore(
      acc.teammates,
      (r) => enoughGames(r) && r.won > 0,
      (r) => winRatio(r, smoothing),
    ),
    worstTeammate: topByScore(
      acc.teammates,
      (r) => enoughGames(r) && r.lost > 0,
      (r) => lossRatio(r, smoothing),
    ),
    nemeses: Object.values(acc.opponents)
      .filter((o) => enoughGames(o) && o.lost > 0)
      .sort(byScoreDesc((r) => lossRatio(r, smoothing))),
  };
};
