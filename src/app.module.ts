import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ProjectModule } from './project/project.module';
@Module({
  imports: [PrismaModule, ConfigModule.forRoot({ isGlobal: true }), AuthModule, ProjectModule],
})
export class AppModule {}
