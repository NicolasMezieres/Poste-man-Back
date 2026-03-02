import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AdminGuard, JwtGuard } from 'src/auth/Guards';
import { GetUser } from 'src/auth/decorator';
import { User } from 'src/prisma/generated';
import {
  queryPage,
  querySearchAdminProject,
  querySearchProject,
  UserWithRole,
} from 'src/utils/type';
import { projectDTO } from './dto';
import { ProjectService } from './project.service';

@UseGuards(JwtGuard)
@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @ApiOkResponse({ description: 'List de project quand tu es membre' })
  @Get('/search')
  search(@Query() query: querySearchProject, @GetUser() user: User) {
    return this.projectService.search(query, user);
  }

  @ApiOkResponse({
    description: 'List de project rechercher par un administrateur',
  })
  @UseGuards(AdminGuard)
  @Get('/searchAdmin')
  searchByAdmin(@Query() query: querySearchAdminProject) {
    return this.projectService.searchByAdmin(query);
  }

  @ApiOkResponse({
    description: 'Information du projet',
  })
  @ApiNotFoundResponse({ description: 'Projet introuvable !' })
  @ApiForbiddenResponse({
    description: 'Vous ne faites pas partie de ce projet !',
  })
  @Get('/:projectId')
  getProject(
    @Param('projectId') projectId: string,
    @GetUser() user: UserWithRole,
  ) {
    return this.projectService.getProject(projectId, user);
  }

  @ApiOkResponse({ description: 'Détail du projet' })
  @ApiNotFoundResponse({ description: 'Projet ou auteur introuvable !' })
  @UseGuards(AdminGuard)
  @Get('/:projectId/detail')
  getDetail(@Param('projectId') projectId: string) {
    return this.projectService.getDetail(projectId);
  }

  @ApiOkResponse({ description: 'Liste des membres du projet' })
  @ApiNotFoundResponse({ description: 'Projet introuvable !' })
  @ApiForbiddenResponse({ description: "Vous n'êtes pas autorisé !" })
  @UseGuards(AdminGuard)
  @Get('/:projectId/listMember')
  getListMember(
    @Param('projectId') projectId: string,
    @GetUser() user: UserWithRole,
  ) {
    return this.projectService.listMember(projectId, user);
  }

  @ApiOkResponse({ description: 'Liste de projet par utilisateur' })
  @ApiNotFoundResponse({ description: 'Utilisateur introuvable' })
  @UseGuards(AdminGuard)
  @Get('projectListByUser/:userId')
  getProjectListByUser(
    @Param('userId') userId: string,
    @Query() query: queryPage,
  ) {
    return this.projectService.getProjectListByUser(userId, query);
  }

  @ApiCreatedResponse({ description: 'Projet créé !' })
  @ApiNotFoundResponse({
    description: 'Rôle du projet introuvable !',
  })
  @Post('/create')
  create(@Body() dto: projectDTO, @GetUser() user: User) {
    return this.projectService.create(dto, user);
  }

  @ApiCreatedResponse({ description: 'Lien créé !' })
  @ApiNotFoundResponse({ description: 'Projet introuvable !' })
  @Post('/:id/link')
  createInvitationLink(@Param('id') id: string, @GetUser() user: User) {
    return this.projectService.createInvitationLink(id, user);
  }

  @ApiCreatedResponse({ description: 'Utilisateur à rejoin le projet' })
  @ApiNotFoundResponse({ description: 'Lien invalide ou Rôle introuvable !' })
  @ApiForbiddenResponse({
    description: 'Lien expiré ou vous êtes déjà dans le projet !',
  })
  @Post('/:id/join')
  joinProject(@Param('id') id: string, @GetUser() user: User) {
    return this.projectService.joinProject(id, user);
  }

  @ApiOkResponse({ description: 'Status mis à jour !' })
  @ApiForbiddenResponse({ description: "Vous n'êtes pas autorisé" })
  @ApiNotFoundResponse({ description: 'Membre introuvable !' })
  @Patch('/:projectId/user/:userId')
  ban(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
    @GetUser() user: User,
  ) {
    return this.projectService.ban(projectId, userId, user);
  }

  @ApiOkResponse({ description: 'Project modifié !' })
  @ApiNotFoundResponse({ description: 'Projet introuvable !' })
  @Patch('/:id')
  rename(
    @Param('id') id: string,
    @Body() dto: projectDTO,
    @GetUser() user: User,
  ) {
    return this.projectService.rename(dto, id, user);
  }

  @ApiOkResponse({ description: 'Projet supprimé ou quitté !' })
  @ApiNotFoundResponse({ description: 'Projet introuvable !' })
  @ApiForbiddenResponse({ description: "Vous n'êtes pas autorisé !" })
  @Delete('/:id')
  remove(@Param('id') id: string, @GetUser() user: UserWithRole) {
    return this.projectService.remove(id, user);
  }

  @ApiOkResponse({ description: 'Utilisateur exclu' })
  @ApiForbiddenResponse({ description: 'Utilisateur introuvable' })
  @Delete('/:projectId/user/:userId')
  kickUser(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
    @GetUser() user: User,
  ) {
    return this.projectService.kickUser(projectId, userId, user);
  }
}
