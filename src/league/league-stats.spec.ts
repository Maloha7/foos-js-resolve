import {
  accumulateMatch,
  DEFAULT_RANKING_OPTIONS,
  emptyPlayerLeagueStats,
  finalizeStats,
  initialStatsAccumulator,
  RANKING_ENV,
  rankingOptionsFromEnv,
  withSeasonFinalRank,
  withSeasonWinner,
  type StatsAccumulator,
} from './league-stats';

// Ordering tests care about the sort, not the sample-size gate — relax the gate
// (minMatches: 1) so small fixtures still qualify. Gating has its own tests.
const RELAXED = { minMatches: 1, smoothing: 1 };

const foldMatches = (
  playerId: string,
  matches: { winners: string[]; losers: string[] }[],
): StatsAccumulator =>
  matches.reduce(
    (acc, match) => accumulateMatch(acc, playerId, match),
    initialStatsAccumulator(),
  );

/** Repeat a match `n` times. */
const times = (
  n: number,
  match: { winners: string[]; losers: string[] },
): { winners: string[]; losers: string[] }[] =>
  Array.from({ length: n }, () => match);

describe('accumulateMatch', () => {
  it('ignores matches the player did not take part in', () => {
    const acc = accumulateMatch(initialStatsAccumulator(), 'me', {
      winners: ['a'],
      losers: ['b'],
    });
    expect(acc).toEqual(initialStatsAccumulator());
  });

  it('counts wins and losses across singles matches', () => {
    const acc = foldMatches('me', [
      { winners: ['me'], losers: ['a'] },
      { winners: ['b'], losers: ['me'] },
      { winners: ['me'], losers: ['c'] },
    ]);
    expect(acc.played).toBe(3);
    expect(acc.won).toBe(2);
    expect(acc.lost).toBe(1);
  });

  it('records the head-to-head record against opponents (wins and losses)', () => {
    const acc = foldMatches('me', [
      { winners: ['me'], losers: ['a'] },
      { winners: ['a'], losers: ['me'] },
    ]);
    expect(acc.opponents['a']).toEqual({ playerId: 'a', won: 1, lost: 1 });
  });

  it('does not mutate the input accumulator (immutability)', () => {
    const start = initialStatsAccumulator();
    accumulateMatch(start, 'me', { winners: ['me', 'x'], losers: ['a', 'b'] });
    expect(start).toEqual(initialStatsAccumulator());
  });
});

describe('finalizeStats — teammates (by smoothed ratio)', () => {
  it('picks best teammate by shared wins and worst by shared losses', () => {
    const acc = foldMatches('me', [
      ...times(2, { winners: ['me', 'ally'], losers: ['a', 'b'] }), // won with ally x2
      ...times(2, { winners: ['a', 'b'], losers: ['me', 'burden'] }), // lost with burden x2
      { winners: ['me', 'burden'], losers: ['a', 'b'] }, // won with burden once
    ]);
    const stats = finalizeStats('L', 'me', acc, RELAXED);

    expect(stats.bestTeammate).toEqual({ playerId: 'ally', won: 2, lost: 0 });
    expect(stats.worstTeammate).toEqual({
      playerId: 'burden',
      won: 1,
      lost: 2,
    });
  });

  it('records no teammates in singles-only play', () => {
    const acc = foldMatches('me', [{ winners: ['me'], losers: ['a'] }]);
    const stats = finalizeStats('L', 'me', acc);
    expect(stats.bestTeammate).toBeNull();
    expect(stats.worstTeammate).toBeNull();
  });

  // Two eligible pairings (gate relaxed) that disagree under raw vs smoothed
  // ordering, so this isolates the smoothing knob.
  const rockAndFluke = () =>
    foldMatches('me', [
      ...times(12, { winners: ['me', 'rock'], losers: ['a', 'b'] }), // 12-0
      ...times(3, { winners: ['a', 'b'], losers: ['me', 'rock'] }), //  +0-3 => 12-3
      { winners: ['me', 'fluke'], losers: ['a', 'b'] }, // 1-0
    ]);

  it('smoothing keeps a lone 1-0 pairing from outranking a seasoned one', () => {
    const stats = finalizeStats('L', 'me', rockAndFluke(), {
      minMatches: 1,
      smoothing: 1,
    });
    // Smoothed 13/4=3.25 (rock) vs 2/1=2.0 (fluke) -> rock...
    expect(stats.bestTeammate?.playerId).toBe('rock');
    // ...and the returned record keeps the REAL counts, not the +1 smoothed ones.
    expect(stats.bestTeammate).toEqual({ playerId: 'rock', won: 12, lost: 3 });
  });

  it('smoothing: 0 reverts to the raw ratio (the 1-0 wins)', () => {
    const stats = finalizeStats('L', 'me', rockAndFluke(), {
      minMatches: 1,
      smoothing: 0,
    });
    // Raw 12/3=4 (rock) vs 1/0=Infinity (fluke) -> fluke.
    expect(stats.bestTeammate?.playerId).toBe('fluke');
  });

  it('excludes teammates below the minMatches gate', () => {
    const acc = foldMatches('me', [
      ...times(5, { winners: ['me', 'seasoned'], losers: ['a', 'b'] }), // 5 games
      ...times(4, { winners: ['me', 'green'], losers: ['a', 'b'] }), // 4 games, all wins
    ]);
    // Default gate is 5: 'green' (4 games) is excluded despite a perfect record.
    const stats = finalizeStats('L', 'me', acc);
    expect(stats.bestTeammate?.playerId).toBe('seasoned');
  });

  it('returns null when no pairing clears the gate', () => {
    const acc = foldMatches('me', [
      ...times(3, { winners: ['me', 'ally'], losers: ['a', 'b'] }),
    ]);
    const stats = finalizeStats('L', 'me', acc); // default minMatches: 5
    expect(stats.bestTeammate).toBeNull();
    expect(stats.worstTeammate).toBeNull();
  });
});

describe('finalizeStats — nemeses (by smoothed ratio)', () => {
  it('orders opponents by losses-against descending, keeping the full record', () => {
    const acc = foldMatches('me', [
      ...times(3, { winners: ['x'], losers: ['me'] }), // lost to x x3
      { winners: ['me'], losers: ['x'] }, // beat x once
      { winners: ['y'], losers: ['me'] }, // lost to y once
      { winners: ['me'], losers: ['z'] }, // only ever beat z — not a nemesis
    ]);
    const stats = finalizeStats('L', 'me', acc, RELAXED);

    expect(stats.nemeses).toEqual([
      { playerId: 'x', won: 1, lost: 3 },
      { playerId: 'y', won: 0, lost: 1 },
    ]);
  });

  it('ranks a heavier losing record above a lone loss (smoothed ratio)', () => {
    const acc = foldMatches('me', [
      // 2-6 against 'heavy' — a real nemesis by ratio and volume.
      ...times(6, { winners: ['heavy'], losers: ['me'] }),
      ...times(2, { winners: ['me'], losers: ['heavy'] }),
      // 0-1 against 'blip' — a single loss.
      { winners: ['blip'], losers: ['me'] },
    ]);
    const stats = finalizeStats('L', 'me', acc, RELAXED);

    // heavy: (6+1)/(2+1)=2.33 ranks above blip: (1+1)/(0+1)=2.0, and records
    // stay raw.
    expect(stats.nemeses).toEqual([
      { playerId: 'heavy', won: 2, lost: 6 },
      { playerId: 'blip', won: 0, lost: 1 },
    ]);
  });

  it('excludes opponents below the minMatches gate', () => {
    const acc = foldMatches('me', [
      ...times(5, { winners: ['regular'], losers: ['me'] }), // lost to regular x5
      ...times(2, { winners: ['stranger'], losers: ['me'] }), // lost to stranger x2
    ]);
    // Default gate is 5: only 'regular' qualifies as a nemesis.
    const stats = finalizeStats('L', 'me', acc);
    expect(stats.nemeses).toEqual([{ playerId: 'regular', won: 0, lost: 5 }]);
  });
});

describe('rankingOptionsFromEnv', () => {
  it('falls back to defaults when unset', () => {
    expect(rankingOptionsFromEnv({})).toEqual(DEFAULT_RANKING_OPTIONS);
  });

  it('reads the two knobs from the environment', () => {
    const opts = rankingOptionsFromEnv({
      [RANKING_ENV.minMatches]: '10',
      [RANKING_ENV.smoothing]: '2',
    });
    expect(opts).toEqual({ minMatches: 10, smoothing: 2 });
  });

  it('ignores non-numeric or negative values, keeping the defaults', () => {
    const opts = rankingOptionsFromEnv({
      [RANKING_ENV.minMatches]: 'lots',
      [RANKING_ENV.smoothing]: '-1',
    });
    expect(opts).toEqual(DEFAULT_RANKING_OPTIONS);
  });

  it('allows smoothing of 0 (raw ratio)', () => {
    expect(
      rankingOptionsFromEnv({ [RANKING_ENV.smoothing]: '0' }).smoothing,
    ).toBe(0);
  });
});

describe('finalizeStats — high/low score', () => {
  it('takes max/min of the per-season final ranks', () => {
    let acc = foldMatches('me', [{ winners: ['me'], losers: ['a'] }]);
    acc = withSeasonFinalRank(acc, 1520);
    acc = withSeasonFinalRank(acc, 1480);
    acc = withSeasonFinalRank(acc, 1600);
    acc = withSeasonFinalRank(acc, undefined); // season the player skipped

    const stats = finalizeStats('L', 'me', acc);
    expect(stats.highScore).toBe(1600);
    expect(stats.lowScore).toBe(1480);
  });

  it('leaves scores null when the player never appeared in any season', () => {
    const stats = finalizeStats('L', 'me', initialStatsAccumulator());
    expect(stats).toEqual(emptyPlayerLeagueStats('L', 'me'));
  });
});

describe('withSeasonWinner', () => {
  it('counts a season the player won', () => {
    const acc = withSeasonWinner(initialStatsAccumulator(), 'me', 'me');
    expect(acc.seasonsWon).toBe(1);
  });

  it('ignores a season someone else won', () => {
    const acc = withSeasonWinner(initialStatsAccumulator(), 'me', 'a');
    expect(acc).toEqual(initialStatsAccumulator());
  });

  it('ignores a season without a winner', () => {
    const acc = withSeasonWinner(initialStatsAccumulator(), 'me', undefined);
    expect(acc).toEqual(initialStatsAccumulator());
  });

  it('reports the total through finalizeStats', () => {
    let acc = foldMatches('me', [{ winners: ['me'], losers: ['a'] }]);
    acc = withSeasonWinner(acc, 'me', 'me');
    acc = withSeasonWinner(acc, 'me', 'a');
    acc = withSeasonWinner(acc, 'me', 'me');

    expect(finalizeStats('L', 'me', acc).seasonsWon).toBe(2);
  });

  it('starts at zero for a player with no stats', () => {
    expect(emptyPlayerLeagueStats('L', 'me').seasonsWon).toBe(0);
  });
});
