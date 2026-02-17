import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { PostGateway } from './post.gateway';
@Module({
  controllers: [PostController],
  providers: [PostService, PrismaService, PostGateway],
  exports: [PostGateway],
})
export class PostModule {}
