import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { role } from 'src/utils/enum';
import { RequestWithCookies } from 'src/utils/interface';
import { UserWithRole } from 'src/utils/type';

@Injectable()
export class JwtAdminStrategy extends PassportStrategy(Strategy, 'admin') {
  constructor(
    config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: (req: RequestWithCookies) => {
        if (!req.cookies || !req.cookies['access_token']) {
          return null;
        }
        return req.cookies['access_token'];
      },
      secretOrKey: config.get('JWT_SECRET') as string,
    });
  }

  async validate(payload: { sub: string }) {
    const user = (await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    })) as UserWithRole | null;
    if (!user || user.role.name !== role.ADMIN) {
      throw new UnauthorizedException('You are not authorized 😡');
    }
    return user;
  }
}
