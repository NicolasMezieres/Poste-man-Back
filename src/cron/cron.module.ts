import { Logger, Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CronService } from './cron.service';

@Module({
  providers: [CronService, PrismaService, Logger],
})
export class CronModule {}
