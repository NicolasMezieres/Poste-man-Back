import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtGuard } from 'src/auth/Guards';
import { GetUser } from 'src/auth/decorator';
import { User } from 'src/prisma/generated';
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
@UseGuards(JwtGuard)
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}
  @ApiOkResponse({ description: "Notifications de l'utilisateur" })
  @Get()
  notifications(@GetUser() user: User) {
    return this.notificationService.notifications(user);
  }

  @ApiOkResponse({ description: 'Notification supprimer !' })
  @Delete('/all')
  removeAll(@GetUser() user: User) {
    return this.notificationService.removeAll(user);
  }

  @ApiForbiddenResponse({ description: 'Notification invalide' })
  @ApiNotFoundResponse({ description: 'Notification introuvable !' })
  @ApiOkResponse({ description: 'Notifications supprimer !' })
  @Delete('/:id')
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.notificationService.remove(id, user);
  }
}
