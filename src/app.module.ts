import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { MessageModule } from './message/message.module';
import { NotificationModule } from './notification/notification.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectModule } from './project/project.module';
import { SectionModule } from './section/section.module';
import { CleangdprModule } from './cleangdpr/cleangdpr.module';
import { CronModule } from './cron/cron.module';
import { UserModule } from './user/user.module';
import { PostModule } from './post/post.module';
import { ThrottlerModule } from '@nestjs/throttler';
@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    EmailModule,
    JwtModule,
    NotificationModule,
    MessageModule,
    ProjectModule,
    SectionModule,
    ScheduleModule.forRoot(),
    CleangdprModule,
    CronModule,
    UserModule,
    PostModule,
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 30000, limit: 10 }] }),
  ],
})
export class AppModule {}
