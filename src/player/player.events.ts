import type { Event } from '@event-driven-io/emmett';

/**
 * Player stream events — ported from `common/event-types.js`.
 *
 * BUGFIX (see nestjs/MIGRATION.md): the original `event-types.js` assigned
 * `PLAYER_EMAIL_CHANGED = 'PLAYER_SET_DEFAULT_LEAGUE'`, colliding two distinct
 * events. Here `PLAYER_EMAIL_CHANGED` gets its own type string. The Phase 4
 * exporter must disambiguate any historical rows accordingly.
 */

// Must be a `type` (not `interface`): Emmett's `Event<T, Data>` constrains
// `Data` to an index-signature record, which interfaces don't satisfy.
type MatchOutcomePayload = {
  season: string;
  matchid: string;
  matchtype: string;
  score: number;
  coplayers: string[];
  opponents: string[];
  rank: number;
};

export type PlayerCreated = Event<
  'PLAYER_CREATED',
  {
    username?: string;
    name: string;
    email: string;
    password: string | null;
    avatar?: string;
  }
>;

export type PlayerDeleted = Event<'PLAYER_DELETED', Record<string, never>>;

export type PlayerWonMatch = Event<'PLAYER_WON_MATCH', MatchOutcomePayload>;

export type PlayerLostMatch = Event<'PLAYER_LOST_MATCH', MatchOutcomePayload>;

export type PlayerSetDefaultLeague = Event<
  'PLAYER_SET_DEFAULT_LEAGUE',
  { id?: string; slug?: string }
>;

export type PlayerEmailChanged = Event<
  'PLAYER_EMAIL_CHANGED',
  { newEmail: string }
>;

export type PlayerAvatarChanged = Event<
  'PLAYER_AVATAR_CHANGED',
  { avatar: string }
>;

export type PlayerEvent =
  | PlayerCreated
  | PlayerDeleted
  | PlayerWonMatch
  | PlayerLostMatch
  | PlayerSetDefaultLeague
  | PlayerEmailChanged
  | PlayerAvatarChanged;
