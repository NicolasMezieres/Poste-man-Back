import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectGateway } from './project.gateway';
import { PostModule } from 'src/post/post.module';
import { MessageModule } from 'src/message/message.module';
@Module({
  controllers: [ProjectController],
  imports: [PostModule, MessageModule],
  providers: [ProjectService, PrismaService, ProjectGateway],
})
export class ProjectModule {}
