import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type EventStore } from '@event-driven-io/emmett';
import { EVENT_STORE } from '../event-store/event-store.constants';
import type { Actor } from '../common/actor';
import {
  decideChangeAvatar,
  decideChangeEmail,
  decideCreatePlayer,
  decideDeletePlayer,
  decideRegisterLoss,
  decideRegisterWin,
  decideResetDefaultLeague,
  decideSetDefaultLeague,
  evolvePlayer,
  initialPlayerState,
} from './player.aggregate';

const streamId = (playerId: string): string => `player-${playerId}`;

interface MatchOutcomeInput {
  season: string;
  matchid: string;
  matchtype: string;
  score: number;
  coplayers: string[];
  opponents: string[];
  rank: number;
}

@Injectable()
export class PlayerService {
  private readonly handle = CommandHandler({
    evolve: evolvePlayer,
    initialState: initialPlayerState,
  });

  constructor(@Inject(EVENT_STORE) private readonly store: EventStore) {}

  createPlayer(
    playerId: string,
    input: {
      username?: string;
      name: string;
      email: string;
      password?: string;
      avatar?: string;
    },
  ) {
    return this.handle(this.store, streamId(playerId), (state) =>
      decideCreatePlayer(state, input),
    );
  }

  deletePlayer(playerId: string, actor: Actor) {
    return this.handle(this.store, streamId(playerId), (state) =>
      decideDeletePlayer(state, playerId, actor),
    );
  }

  setDefaultLeague(playerId: string, input: { id?: string; slug?: string }) {
    return this.handle(this.store, streamId(playerId), (state) =>
      decideSetDefaultLeague(state, input),
    );
  }

  resetDefaultLeague(playerId: string) {
    return this.handle(this.store, streamId(playerId), (state) =>
      decideResetDefaultLeague(state),
    );
  }

  registerWin(playerId: string, input: MatchOutcomeInput) {
    return this.handle(this.store, streamId(playerId), (state) =>
      decideRegisterWin(state, input),
    );
  }

  registerLoss(playerId: string, input: MatchOutcomeInput) {
    return this.handle(this.store, streamId(playerId), (state) =>
      decideRegisterLoss(state, input),
    );
  }

  changeEmail(playerId: string, input: { newEmail: string }) {
    return this.handle(this.store, streamId(playerId), (state) =>
      decideChangeEmail(state, input),
    );
  }

  changeAvatar(playerId: string, input: { avatar: string }) {
    return this.handle(this.store, streamId(playerId), (state) =>
      decideChangeAvatar(state, input),
    );
  }
}
