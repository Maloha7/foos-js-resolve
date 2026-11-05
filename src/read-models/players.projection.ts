import { pongoProjection } from '@event-driven-io/emmett-postgresql';
import type { PlayerEvent } from '../player/player.events';
import type { PlayerDoc } from './read-model.types';
import { upsertById } from './pongo-util';

const idFrom = (streamName: string): string =>
  streamName.slice('player-'.length);

/**
 * Players read-model — ported from `common/read-models/players.projection.js`,
 * and consolidating the `PlayerName`/`PlayerSettings` view-models (name +
 * default league) into the same document.
 *
 * Free-hand projection because two behaviours need to query the collection:
 * "the first registered user is a superuser" (global count) and folding across
 * several player events. Runs inline (same transaction as the append).
 */
export const playersProjection = pongoProjection<PlayerEvent>({
  name: 'players',
  canHandle: [
    'PLAYER_CREATED',
    'PLAYER_DELETED',
    'PLAYER_WON_MATCH',
    'PLAYER_LOST_MATCH',
    'PLAYER_SET_DEFAULT_LEAGUE',
    'PLAYER_EMAIL_CHANGED',
    'PLAYER_AVATAR_CHANGED',
  ],
  handle: async (events, { pongo }) => {
    const players = pongo.db().collection<PlayerDoc>('players');

    for (const event of events) {
      const id = idFrom(event.metadata.streamName);

      switch (event.type) {
        case 'PLAYER_CREATED': {
          // First registered user becomes the superuser (matches original).
          // countDocuments returns the count as a string (pg bigint), so coerce.
          const existing = Number(await players.countDocuments({}));
          await upsertById(players, id, {
            name: event.data.name,
            email: event.data.email,
            avatar: event.data.avatar,
            password: event.data.password,
            isSuperuser: existing === 0,
          });
          break;
        }
        case 'PLAYER_DELETED':
          await players.deleteOne({ _id: id });
          break;
        case 'PLAYER_WON_MATCH':
        case 'PLAYER_LOST_MATCH':
          await players.updateOne(
            { _id: id },
            { $set: { currentRank: event.data.rank } },
          );
          break;
        case 'PLAYER_SET_DEFAULT_LEAGUE':
          await players.updateOne(
            { _id: id },
            {
              $set: {
                defaultLeague: { id: event.data.id, slug: event.data.slug },
              },
            },
          );
          break;
        case 'PLAYER_EMAIL_CHANGED':
          await players.updateOne(
            { _id: id },
            { $set: { email: event.data.newEmail } },
          );
          break;
        case 'PLAYER_AVATAR_CHANGED':
          await players.updateOne(
            { _id: id },
            { $set: { avatar: event.data.avatar } },
          );
          break;
      }
    }
  },
});
