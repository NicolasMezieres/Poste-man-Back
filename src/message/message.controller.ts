import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MessageService } from './message.service';
import { JwtGuard } from 'src/auth/Guards';
import { GetUser } from 'src/auth/decorator';
import { User } from 'src/prisma/generated';
import { messageDTO } from './dto';
import { queryMessage, UserWithRole } from 'src/utils/type';
import {
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

@UseGuards(JwtGuard)
@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @ApiOkResponse({ description: 'Messages of project' })
  @ApiNotFoundResponse({ description: 'Project not found !' })
  @ApiForbiddenResponse({ description: 'You are unauthorized !' })
  @Get('/project/:projectId')
  projectMessages(
    @Param('projectId') projectId: string,
    @GetUser() user: UserWithRole,
    @Query() query: queryMessage,
  ) {
    return this.messageService.projectMessages(projectId, user, query);
  }

  @ApiCreatedResponse({
    description: 'The message has been successfully created.',
  })
  @ApiNotFoundResponse({ description: 'Project not found !' })
  @Post('/project/:projectId')
  createMessage(
    @Param('projectId') projectId: string,
    @Body() dto: messageDTO,
    @GetUser() user: User,
  ) {
    return this.messageService.createMessage(dto, projectId, user);
  }

  @ApiNotFoundResponse({ description: 'Message not found !' })
  @ApiForbiddenResponse({ description: 'You are unauthorized !' })
  @ApiNoContentResponse({ description: 'Message deleted !' })
  @Delete('/:messageId')
  deleteMessage(
    @Param('messageId') messageId: string,
    @GetUser() user: UserWithRole,
  ) {
    return this.messageService.deleteMessage(messageId, user);
  }

  @ApiNotFoundResponse({ description: 'Project not found' })
  @ApiForbiddenResponse({ description: 'You are unauthorized !' })
  @ApiNoContentResponse({ description: 'Message deleted !' })
  @Delete('/project/:projectId')
  deleteAllMessage(
    @Param('projectId') projectId: string,
    @GetUser() user: UserWithRole,
  ) {
    return this.messageService.deleteAllMessage(projectId, user);
  }
}
