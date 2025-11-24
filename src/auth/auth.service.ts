import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon from 'argon2';
import { Response } from 'express';
import { EmailService } from 'src/email/email.service';
import { User } from 'src/prisma/generated';
import { PrismaService } from 'src/prisma/prisma.service';
import { role } from 'src/utils/enum';
import {
  ForgetPasswordDTO,
  ResetPasswordDTO,
  SignInDTO,
  SignUpDTO,
} from './dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signToken(
    user: User,
    delay: number,
  ): Promise<{ connexion_token: string }> {
    const payload = { sub: user.id };
    return {
      connexion_token: await this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_SECRET'),
        expiresIn: delay,
      }),
    };
  }
  async signup(dto: SignUpDTO) {
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new UnauthorizedException('Username already taken 😱');
    }
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new UnauthorizedException('Email already taken 😱');
    }
    const existingRole = await this.prisma.role.findUnique({
      where: { name: role.USER },
    });
    if (!existingRole) {
      throw new InternalServerErrorException();
    }
    const hashPassword = await argon.hash(dto.password);
    const activateToken = await argon.hash(dto.password + dto.email);
    const newToken = activateToken.replaceAll('/', '').replaceAll('=', '');
    const newUser = await this.prisma.user.create({
      data: {
        ...dto,
        roleId: existingRole.id,
        password: hashPassword,
        activateToken: newToken,
      },
    });
    await this.email.accountConfirmation(newUser, newToken);
    return { message: 'Your account as been create !' };
  }
  async activationAccount(token: string) {
    const existingUser = await this.prisma.user.findFirst({
      where: { activateToken: token },
    });
    if (!existingUser) {
      throw new NotFoundException('Account not found');
    }
    await this.prisma.user.update({
      where: { id: existingUser.id },
      data: {
        activateToken: '',
        isActive: true,
      },
    });
    return {
      message: 'Your account has been created !',
    };
  }
  async signin(dto: SignInDTO, res: Response) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.identifier }, { username: dto.identifier }],
      },
      include: { role: true },
    });
    if (!existingUser) {
      throw new UnauthorizedException('Invalid credential');
    } else if (existingUser.isActive === false) {
      throw new UnauthorizedException('Your account is not activate');
    }

    const isSamePassword = await argon.verify(
      existingUser.password,
      dto.password,
    );

    if (!isSamePassword) {
      throw new UnauthorizedException('Invalid credential');
    }
    const token = await this.signToken(existingUser, '1d');
    res.cookie('access_token', token.connexion_token, {
      httpOnly: true,
      sameSite: process.env.IS_PRODUCTION === 'true' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7,
      secure: process.env.IS_PRODUCTION === 'true' ? true : false,
    });
    return { message: 'Connexion succesfully', role: existingUser.role.name };
  }
  async forgetPassword(dto: ForgetPasswordDTO) {
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingEmail && existingEmail.isActive) {
      const token = await this.signToken(existingEmail, '10m');
      await this.email.forgetPassword(existingEmail, token.connexion_token);
    } else if (existingEmail && !existingEmail.isActive) {
      throw new ForbiddenException('Your account is not activate');
    }
    return {
      message: 'A mail was send.',
    };
  }
  async resetPassword(user: User, dto: ResetPasswordDTO) {
    const hash = await argon.hash(dto.password);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hash },
    });
    return { message: 'Your password has been change' };
  }
}
