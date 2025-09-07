import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from 'src/email/email.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { resetPasswordStrategy } from './strategy/reset.password.strategy';
import { JwtStrategy } from './strategy/jwt.strategy';
import { JwtAdminStrategy } from './strategy/admin.strategy';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaService,
    EmailService,
    JwtService,
    JwtStrategy,
    JwtAdminStrategy,
    resetPasswordStrategy,
    ConfigService,
  ],
})
export class AuthModule {}
