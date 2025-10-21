import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { AdminGuard, JwtGuard } from 'src/auth/Guards';
import { GetUser } from 'src/auth/decorator';
import { User } from 'src/prisma/generated';
import { messageDTO } from './dto';
import { UserWithRole } from 'src/utils/type';

@UseGuards(JwtGuard)
@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get('/project/:projectId')
  projectMessages(
    @Param('projectId') projectId: string,
    @GetUser() user: User,
  ) {
    return this.messageService.projectMessages(projectId, user);
  }

  @UseGuards(AdminGuard)
  @Get('/project/:projectId/admin')
  projectMessagesAdmin(@Param('projectId') projectId: string) {
    return this.messageService.projectMessagesAdmin(projectId);
  }

  @Post('/project/:projectId')
  createMessage(
    @Param('projectId') projectId: string,
    @Body() dto: messageDTO,
    @GetUser() user: User,
  ) {
    return this.messageService.createMessage(dto, projectId, user);
  }

  @Delete('/:messageId')
  deleteMessage(
    @Param('messageId') messageId: string,
    @GetUser() user: UserWithRole,
  ) {
    return this.messageService.deleteMessage(messageId, user);
  }

  @Delete('/project/:projectId')
  deleteAllMessage(
    @Param('projectId') projectId: string,
    @GetUser() user: UserWithRole,
  ) {
    return this.messageService.deleteAllMessage(projectId, user);
  }
}
