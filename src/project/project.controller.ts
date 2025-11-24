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
import { AdminGuard, JwtGuard } from 'src/auth/Guards';
import { GetUser } from 'src/auth/decorator';
import { User } from 'src/prisma/generated/client';
import { projectDTO } from './dto';
import { ProjectService } from './project.service';
import {
  querySearchAdminProject,
  querySearchProject,
  UserWithRole,
} from 'src/utils/type';
import {
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

@UseGuards(JwtGuard)
@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @ApiOkResponse({ description: 'List of project when you are member ' })
  @Get('/search')
  search(@Query() query: querySearchProject, @GetUser() user: User) {
    return this.projectService.search(query, user);
  }

  @ApiOkResponse({ description: 'List of project searched' })
  @UseGuards(AdminGuard)
  @Get('/searchAdmin')
  searchByAdmin(@Query() query: querySearchAdminProject) {
    return this.projectService.searchByAdmin(query);
  }

  @ApiCreatedResponse({ description: 'Project successfully create !' })
  @ApiInternalServerErrorResponse({ description: 'Role project not found !' })
  @Post('/create')
  create(@Body() dto: projectDTO, @GetUser() user: User) {
    return this.projectService.create(dto, user);
  }

  @ApiCreatedResponse({ description: 'Link created !' })
  @ApiNotFoundResponse({ description: 'Project not found !' })
  @Post('/:id/link')
  createInvitationLink(@Param('id') id: string, @GetUser() user: User) {
    return this.projectService.createInvitationLink(id, user);
  }

  @ApiCreatedResponse({ description: 'Join project' })
  @ApiNotFoundResponse({ description: 'Link invalid !' })
  @ApiForbiddenResponse({
    description: 'Link expired or you are already in the project !',
  })
  @ApiInternalServerErrorResponse({
    description: 'Role not found or failed to add user in project !',
  })
  @Post('/:id/join')
  joinProject(@Param('id') id: string, @GetUser() user: User) {
    return this.projectService.joinProject(id, user);
  }

  @ApiNoContentResponse({ description: 'Ban status updated !' })
  @ApiForbiddenResponse({ description: 'You are unauthorized !' })
  @ApiNotFoundResponse({ description: 'Not found member !' })
  @Patch('/:projectId/user/:userId')
  ban(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
    @GetUser() user: User,
  ) {
    return this.projectService.ban(projectId, userId, user);
  }

  @ApiNoContentResponse({ description: 'Project modified !' })
  @ApiNotFoundResponse({ description: 'Project not found !' })
  @Patch('/:id')
  rename(
    @Param('id') id: string,
    @Body() dto: projectDTO,
    @GetUser() user: User,
  ) {
    return this.projectService.rename(dto, id, user);
  }

  @ApiNoContentResponse({ description: 'Project deleted or leaved !' })
  @ApiNotFoundResponse({ description: 'Project not found !' })
  @Delete('/:id')
  remove(@Param('id') id: string, @GetUser() user: UserWithRole) {
    return this.projectService.remove(id, user);
  }
  @ApiNoContentResponse({ description: 'User kick' })
  @ApiForbiddenResponse({ description: 'User not found' })
  @Delete('/:projectId/user/:userId')
  kickUser(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
    @GetUser() user: User,
  ) {
    return this.projectService.kickUser(projectId, userId, user);
  }
}
