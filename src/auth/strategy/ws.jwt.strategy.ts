import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Socket } from 'socket.io';
import { Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtValidatedUser } from 'src/utils/type';
import * as cookie from 'cookie';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsJwtStrategy extends PassportStrategy(Strategy, 'wsJwt') {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: (client: Socket) => {
        if (!client.handshake.headers.cookie) {
          return null;
        }

        const jwtCookie = cookie.parse(client.handshake.headers.cookie)[
          'access_token'
        ];
        if (!jwtCookie) {
          return null;
        }
        return jwtCookie;
      },
      secretOrKey: config.get('JWT_SECRET') as string,
    });
  }

  async validate(payload: { sub: string }): Promise<JwtValidatedUser> {
    const user: JwtValidatedUser | null = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        isActive: true,
        role: { select: { name: true } },
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        icon: true,
      },
    });
    if (!user) {
      throw new WsException('You are not authorized 😡');
    } else if (user.isActive === false) {
      throw new WsException('Your account is not active 😱');
    }
    return user;
  }
}
