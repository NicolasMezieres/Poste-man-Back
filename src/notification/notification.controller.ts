import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtGuard } from 'src/auth/Guards';
import { GetUser } from 'src/auth/decorator';
import { User } from 'src/prisma/generated';
@UseGuards(JwtGuard)
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}
  @Get()
  notifications(@GetUser() user: User) {
    return this.notificationService.notifications(user);
  }
  @Delete('/all')
  removeAll(@GetUser() user: User) {
    return this.notificationService.removeAll(user);
  }
  @Delete('/:id')
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.notificationService.remove(id, user);
  }
}
