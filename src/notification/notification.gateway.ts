import { UseGuards } from '@nestjs/common';
import { WebSocketGateway } from '@nestjs/websockets';
import { WsJwtGuard } from 'src/auth/Guards/ws.jwt.guard';
import { NotificationService } from './notification.service';

@WebSocketGateway({
  cors: { origin: ['http://localhost:4200'], credentials: true },
})
@UseGuards(WsJwtGuard)
export class NotificationGateway {
  constructor(private notification: NotificationService) {}
}
