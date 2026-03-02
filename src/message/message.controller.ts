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
import { AdminGuard, JwtGuard } from 'src/auth/Guards';
import { GetUser } from 'src/auth/decorator';
import { User } from 'src/prisma/generated';
import { messageDTO } from './dto';
import { queryMessage, queryPage, UserWithRole } from 'src/utils/type';
import {
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

@UseGuards(JwtGuard)
@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @ApiOkResponse({ description: 'Messages du project' })
  @ApiNotFoundResponse({ description: 'Project introuvable !' })
  @ApiForbiddenResponse({ description: "Vous n'êtes pas dans le projet" })
  @Get('/project/:projectId')
  projectMessages(
    @Param('projectId') projectId: string,
    @GetUser() user: UserWithRole,
    @Query() query: queryMessage,
  ) {
    return this.messageService.projectMessages(projectId, user, query);
  }

  @ApiOkResponse({ description: 'Nom du projet' })
  @ApiNotFoundResponse({ description: 'Project introuvable' })
  @ApiForbiddenResponse({ description: "Vous n'êtes pas dans le projet" })
  @Get('/project/:projectId/name')
  projectName(
    @Param('projectId') projectId: string,
    @GetUser() user: UserWithRole,
  ) {
    return this.messageService.projectName(projectId, user);
  }

  @ApiOkResponse({ description: 'Liste des message par utilisateur' })
  @ApiNotFoundResponse({ description: 'Utilisateur introuvable !' })
  @UseGuards(AdminGuard)
  @Get('/user/:userId')
  getListMessageByUser(
    @Param('userId') userId: string,
    @Query() query: queryPage,
  ) {
    return this.messageService.getListMessageByUser(userId, query);
  }

  @ApiCreatedResponse({
    description: 'Message créer !',
  })
  @ApiNotFoundResponse({ description: 'Projet introuvable !' })
  @Post('/project/:projectId')
  createMessage(
    @Param('projectId') projectId: string,
    @Body() dto: messageDTO,
    @GetUser() user: User,
  ) {
    return this.messageService.createMessage(dto, projectId, user);
  }

  @ApiOkResponse({ description: 'Message supprimer !' })
  @ApiNotFoundResponse({ description: 'Message introuvable !' })
  @ApiForbiddenResponse({ description: "Vous n'êtes pas autoriser !" })
  @Delete('/:messageId')
  deleteMessage(
    @Param('messageId') messageId: string,
    @GetUser() user: UserWithRole,
  ) {
    return this.messageService.deleteMessage(messageId, user);
  }

  @ApiNotFoundResponse({ description: 'Projet introuvable !' })
  @ApiForbiddenResponse({ description: "Vous n'êtes pas autoriser !" })
  @ApiOkResponse({ description: 'Messages supprimer !' })
  @Delete('/project/:projectId')
  deleteAllMessage(
    @Param('projectId') projectId: string,
    @GetUser() user: UserWithRole,
  ) {
    return this.messageService.deleteAllMessage(projectId, user);
  }
}
