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
  deleteMessage(@Param('messageId') messageId: string, @GetUser() user: User) {
    return this.messageService.deleteMessage(messageId, user);
  }

  @Delete('/all/project/:projectId')
  deleteAllMessage(
    @Param('projectId') projectId: string,
    @GetUser() user: User,
  ) {
    return this.messageService.deleteAllMessage(projectId, user);
  }
}
