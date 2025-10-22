import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { MessageGateway } from './message.gateway';
import { NotificationService } from 'src/notification/notification.service';

@Module({
  controllers: [MessageController],
  providers: [
    MessageService,
    PrismaService,
    MessageGateway,
    NotificationService,
  ],
})
export class MessageModule {}
