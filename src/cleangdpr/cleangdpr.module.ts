import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CleangdprService } from './cleangdpr.service';

@Module({
  providers: [CleangdprService, PrismaService],
})
export class CleangdprModule {}
