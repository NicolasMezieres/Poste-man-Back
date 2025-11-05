import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtGuard } from 'src/auth/Guards';
import { GetUser } from 'src/auth/decorator';
import { User } from 'src/prisma/generated';
import {
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
@UseGuards(JwtGuard)
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}
  @ApiOkResponse({ description: 'My notifications' })
  @Get()
  notifications(@GetUser() user: User) {
    return this.notificationService.notifications(user);
  }

  @ApiNoContentResponse({ description: 'My notifications deleted' })
  @Delete('/all')
  removeAll(@GetUser() user: User) {
    return this.notificationService.removeAll(user);
  }

  @ApiForbiddenResponse({ description: 'Notification is not a valid id' })
  @ApiNotFoundResponse({ description: 'Notification not found !' })
  @ApiNoContentResponse({ description: 'Notification deleted !' })
  @Delete('/:id')
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.notificationService.remove(id, user);
  }
}
