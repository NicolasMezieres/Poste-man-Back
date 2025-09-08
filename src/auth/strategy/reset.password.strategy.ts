import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RequestWithCookies } from 'src/utils/interface';

@Injectable()
export class resetPasswordStrategy extends PassportStrategy(
  Strategy,
  'resetPassword',
) {
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
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        isActive: true,
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
