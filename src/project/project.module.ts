import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectGateway } from './project.gateway';

@Module({
  controllers: [ProjectController],
  providers: [ProjectService, PrismaService, ProjectGateway],
})
export class ProjectModule {}
