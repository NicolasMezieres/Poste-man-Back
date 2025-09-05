import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module';
import { JwtAdminStrategy } from './auth/strategy/admin.strategy';
import { JwtStrategy } from './auth/strategy/jwt.strategy';
import { EmailModule } from './email/email.module';
import { PrismaModule } from './prisma/prisma.module';
import { NotificationModule } from './notification/notification.module';
import { MessageModule } from './message/message.module';
@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    EmailModule,
    JwtModule,
    JwtStrategy,
    JwtAdminStrategy,
    NotificationModule,
    MessageModule,
  ],
})
export class AppModule {}
