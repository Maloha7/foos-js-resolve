import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { type JwtClaims } from './auth.constants';
import { signToken, verifyToken } from './token';
import { PlayerService } from '../player/player.service';
import { PlayersQueryService } from '../read-models/players.query.service';

/** Derive a display name from the email local-part (ported from register callback). */
const extractName = (email: string): string =>
  email
    .match(/^([^@]*)@/)![1]
    .replace(/[0-9!#$%&'*+/=?^_`{|}~.]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/(?<=\W|^)\w/g, (r) => r.toUpperCase())
    .trim();

/**
 * Auth service — ports `auth/route-login-callback.js`,
 * `auth/route-register-callback.js`, and the Slack login callback.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly playerCommands: PlayerService,
    private readonly players: PlayersQueryService,
  ) {}

  sign(claims: JwtClaims): string {
    return signToken(claims);
  }

  verify(token: string): JwtClaims {
    return verifyToken(token);
  }

  /** Local login — mirrors the `Players.login` resolver + token signing. */
  async login(username: string, password: string): Promise<string> {
    const user = await this.players.login(username.trim(), password);
    if (!user)
      throw new UnauthorizedException('Incorrect "username" or "password"');
    return this.sign({
      id: user.id!,
      name: user.name,
      email: user.email,
      superuser: user.isSuperuser,
    });
  }

  /** Local registration — create the player then issue a token. */
  async register(username: string, password: string): Promise<string> {
    const email = username.trim();
    const existing = await this.players.byEmail(email);
    if (existing) throw new UnauthorizedException('User cannot be created');

    const id = randomUUID();
    await this.playerCommands.createPlayer(id, {
      name: extractName(email),
      email,
      password,
    });

    // Read-model projection is inline, so isSuperuser is already available.
    const created = await this.players.getById(id);
    return this.sign({
      id,
      name: created?.name,
      email,
      superuser: created?.isSuperuser,
    });
  }

  /**
   * Slack login/upsert — ports `auth/slack/route-login-callback.js`.
   * `profile.user` carries { email, name, id, image_192 }.
   */
  async slackUpsert(profile: {
    user: { email: string; name: string; id: string; image_192?: string };
  }): Promise<string> {
    const existing = await this.players.byEmail(profile.user.email);
    if (existing) {
      if (profile.user.image_192 && profile.user.image_192 !== existing.avatar) {
        await this.playerCommands.changeAvatar(existing.id!, {
          avatar: profile.user.image_192,
        });
      }
      return this.sign({
        id: existing.id!,
        name: existing.name,
        email: existing.email,
        superuser: existing.isSuperuser,
        method: 'slack',
        avatar: profile.user.image_192,
        slackid: profile.user.id,
      });
    }
    const id = randomUUID();
    await this.playerCommands.createPlayer(id, {
      name: profile.user.name,
      email: profile.user.email,
      avatar: profile.user.image_192,
    });
    return this.sign({
      id,
      name: profile.user.name,
      email: profile.user.email,
      method: 'slack',
      avatar: profile.user.image_192,
      slackid: profile.user.id,
    });
  }
}
