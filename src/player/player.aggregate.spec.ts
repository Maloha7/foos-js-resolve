import { IllegalStateError } from '@event-driven-io/emmett';
import { decideChangeAvatar, initialPlayerState } from './player.aggregate';

describe('decideChangeAvatar', () => {
  const existingPlayer = { createdAt: 1 };

  it('emits PLAYER_AVATAR_CHANGED with the new avatar', () => {
    expect(
      decideChangeAvatar(existingPlayer, { avatar: 'https://img/a.png' }),
    ).toEqual({
      type: 'PLAYER_AVATAR_CHANGED',
      data: { avatar: 'https://img/a.png' },
    });
  });

  it('rejects a player that does not exist', () => {
    expect(() =>
      decideChangeAvatar(initialPlayerState(), { avatar: 'https://img/a.png' }),
    ).toThrow(IllegalStateError);
  });

  it('rejects an empty avatar', () => {
    expect(() => decideChangeAvatar(existingPlayer, { avatar: '' })).toThrow(
      IllegalStateError,
    );
  });
});
