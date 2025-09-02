import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { PrismaClient } from '@prisma/client/extension';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private prisma: PrismaClient,
  ) {
    super({
      jwtFromRequest: (req: Request) => {
        if (!req.cookies || !req.cookies['access_token']) {
          return null;
        }
        return req.cookies['access_token'];
      },
      secretOrKey: config.get('JWT_SECRET') as string,
    });
  }

  async validate(payload: { sub: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        isActive: true,
        role: { select: { name: true } },
        firstName: true,
        lastName: true,
        username: true,
        email: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('You are not authorized 😡');
    } else if (user.isActive === false) {
      throw new ForbiddenException('Your account is not active 😱');
    }
    return user;
  }
}
