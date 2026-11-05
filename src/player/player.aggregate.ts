import { IllegalStateError } from '@event-driven-io/emmett';
import { hashPassword } from '../common/password';
import type { Actor } from '../common/actor';
import type {
  PlayerAvatarChanged,
  PlayerCreated,
  PlayerDeleted,
  PlayerEmailChanged,
  PlayerEvent,
  PlayerLostMatch,
  PlayerSetDefaultLeague,
  PlayerWonMatch,
} from './player.events';

/**
 * Player aggregate — ported from `common/aggregates/player.{projection,commands}.js`.
 */
export interface PlayerState {
  createdAt?: number;
}

export const initialPlayerState = (): PlayerState => ({});

// Only `PLAYER_CREATED` affects command-decision state in the original projection.
export const evolvePlayer = (
  state: PlayerState,
  event: PlayerEvent,
): PlayerState => {
  switch (event.type) {
    case 'PLAYER_CREATED':
      // The original stamped `createdAt` from the event timestamp; any truthy
      // value satisfies the existence guards, so we use the fold position marker.
      return { ...state, createdAt: state.createdAt ?? 1 };
    default:
      return state;
  }
};

const EMAIL_RE = /^\w+([+.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

interface MatchOutcomeInput {
  season: string;
  matchid: string;
  matchtype: string;
  score: number;
  coplayers: string[];
  opponents: string[];
  rank: number;
}

export const decideCreatePlayer = (
  state: PlayerState,
  input: {
    username?: string;
    name: string;
    email: string;
    password?: string;
    avatar?: string;
  },
): PlayerCreated => {
  if (state.createdAt) throw new IllegalStateError('The player already exists');
  if (!input.name) throw new IllegalStateError('name is required');
  if (!input.email) throw new IllegalStateError('email is required');
  if (!EMAIL_RE.test(input.email)) throw new IllegalStateError('email is invalid');

  return {
    type: 'PLAYER_CREATED',
    data: {
      username: input.username,
      name: input.name,
      email: input.email,
      password: input.password ? hashPassword(input.password) : null,
      avatar: input.avatar,
    },
  };
};

export const decideDeletePlayer = (
  state: PlayerState,
  playerId: string,
  actor: Actor,
): PlayerDeleted => {
  if (!actor.id) throw new IllegalStateError('The "id" field is required');
  if (actor.id !== playerId && !actor.superuser)
    throw new IllegalStateError('Only self or superuser can delete player');
  if (!state.createdAt) throw new IllegalStateError('Player does not exist');
  return { type: 'PLAYER_DELETED', data: {} };
};

export const decideSetDefaultLeague = (
  state: PlayerState,
  input: { id?: string; slug?: string },
): PlayerSetDefaultLeague => {
  if (!state.createdAt) throw new IllegalStateError('Player does not exist');
  return { type: 'PLAYER_SET_DEFAULT_LEAGUE', data: { id: input.id, slug: input.slug } };
};

export const decideResetDefaultLeague = (
  state: PlayerState,
): PlayerSetDefaultLeague => {
  if (!state.createdAt) throw new IllegalStateError('Player does not exist');
  return {
    type: 'PLAYER_SET_DEFAULT_LEAGUE',
    data: { id: undefined, slug: undefined },
  };
};

export const decideRegisterWin = (
  state: PlayerState,
  input: MatchOutcomeInput,
): PlayerWonMatch => {
  if (!state.createdAt) throw new IllegalStateError('Player does not exist');
  return { type: 'PLAYER_WON_MATCH', data: { ...input } };
};

export const decideRegisterLoss = (
  state: PlayerState,
  input: MatchOutcomeInput,
): PlayerLostMatch => {
  if (!state.createdAt) throw new IllegalStateError('Player does not exist');
  return { type: 'PLAYER_LOST_MATCH', data: { ...input } };
};

/**
 * `changeEmail` command referenced by `api/emailChange.js` but never defined in
 * the original `player.commands.js`. Added here (emitting the now-distinct
 * `PLAYER_EMAIL_CHANGED`) so the email-change flow can be ported in Phase 2.
 */
export const decideChangeEmail = (
  state: PlayerState,
  input: { newEmail: string },
): PlayerEmailChanged => {
  if (!state.createdAt) throw new IllegalStateError('Player does not exist');
  if (!input.newEmail) throw new IllegalStateError('newEmail is required');
  if (!EMAIL_RE.test(input.newEmail)) throw new IllegalStateError('email is invalid');
  return { type: 'PLAYER_EMAIL_CHANGED', data: { newEmail: input.newEmail } };
};

export const decideChangeAvatar = (
  state: PlayerState,
  input: { avatar: string },
): PlayerAvatarChanged => {
  if (!state.createdAt) throw new IllegalStateError('Player does not exist');
  if (!input.avatar) throw new IllegalStateError('avatar is required');
  return { type: 'PLAYER_AVATAR_CHANGED', data: { avatar: input.avatar } };
};
