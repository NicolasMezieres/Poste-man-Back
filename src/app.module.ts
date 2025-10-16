import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { PrismaModule } from './prisma/prisma.module';
import { NotificationModule } from './notification/notification.module';
import { MessageModule } from './message/message.module';
import { ProjectModule } from './project/project.module';
import { SectionModule } from './section/section.module';
import { PostModule } from './post/post.module';
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
    PostModule,
  ],
})
export class AppModule {}
