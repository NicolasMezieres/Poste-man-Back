import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from 'src/email/email.service';
import { HashService } from 'src/hash/hash.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { resetPasswordStrategy } from './strategy/reset.password.strategy';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaService,
    EmailService,
    JwtService,
    HashService,
    resetPasswordStrategy,
    ConfigService,
  ],
})
export class AuthModule {}
