import { Module } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { EmailService } from './email.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  providers: [EmailService, AuthService, PrismaService, JwtService],
})
export class EmailModule {}
