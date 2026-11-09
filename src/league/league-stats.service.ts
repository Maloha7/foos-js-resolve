import { Inject, Injectable } from '@nestjs/common';
import type { EventStore } from '@event-driven-io/emmett';
import { EVENT_STORE } from '../event-store/event-store.constants';
import type { SeasonEvent } from '../season/season.events';
import {
  evolveSeasonRanks,
  initialSeasonRanks,
} from '../season/season-ranks.view';
import { applyCorrections } from '../season/season-corrections';
import { LeagueService } from './league.service';
import {
  accumulateMatch,
  finalizeStats,
  initialStatsAccumulator,
  rankingOptionsFromEnv,
  withSeasonFinalRank,
  withSeasonWinner,
  type PlayerLeagueStats,
  type StatsAccumulator,
} from './league-stats';

const seasonStreamId = (seasonId: string): string => `season-${seasonId}`;

/**
 * On-demand read facade for a player's league-wide career stats.
 *
 * Mirrors `SeasonService.getRanks`: rather than a persisted projection, it
 * folds each of the league's season streams at query time. Each stream is first
 * resolved through `applyCorrections` so corrected/voided matches are reflected;
 * the season's final rank comes from reusing `evolveSeasonRanks` verbatim, and
 * totals and partner / nemesis tallies are folded from the resulting effective
 * `SEASON_MATCH_REGISTERED` events in the same single pass.
 */
@Injectable()
export class LeagueStatsService {
  constructor(
    @Inject(EVENT_STORE) private readonly store: EventStore,
    private readonly leagues: LeagueService,
  ) {}

  async getPlayerStats(
    leagueId: string,
    playerId: string,
  ): Promise<PlayerLeagueStats> {
    const { seasons, currentSeason } = await this.leagues.getState(leagueId);

    let acc: StatsAccumulator = initialStatsAccumulator();

    for (const seasonId of seasons) {
      const { events } = await this.store.readStream<SeasonEvent>(
        seasonStreamId(seasonId),
      );
      if (!events?.length) continue;

      // Resolve corrections/voids once; both the final-rank fold and the
      // partner/nemesis tallies below then see the corrected outcomes.
      const effective = applyCorrections(events);

      const ranks = effective.reduce(evolveSeasonRanks, initialSeasonRanks());
      acc = withSeasonFinalRank(
        acc,
        ranks.ranks.find((r) => r.id === playerId)?.rank,
      );
      if (seasonId !== currentSeason) {
        acc = withSeasonWinner(acc, playerId, ranks.ranks[0]?.id);
      }

      for (const event of effective) {
        if (event.type === 'SEASON_MATCH_REGISTERED') {
          acc = accumulateMatch(acc, playerId, event.data);
        }
      }
    }

    return finalizeStats(leagueId, playerId, acc, rankingOptionsFromEnv());
  }
}
