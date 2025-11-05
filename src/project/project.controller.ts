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
import { User } from 'src/prisma/generated';
import { querySearchAdminProject, querySearchProject } from 'src/utils/type';
import { projectDTO } from './dto';
import { ProjectService } from './project.service';

@UseGuards(JwtGuard)
@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get('/search')
  search(@Query() query: querySearchProject, @GetUser() user: User) {
    return this.projectService.search(query, user);
  }

  @UseGuards(AdminGuard)
  @Get('/searchAdmin')
  searchByAdmin(@Query() query: querySearchAdminProject) {
    return this.projectService.searchByAdmin(query);
  }

  @Post('/create')
  create(@Body() dto: projectDTO, @GetUser() user: User) {
    return this.projectService.create(dto, user);
  }

  @Post('/:id/link')
  createInvitationLink(@Param('id') id: string, @GetUser() user: User) {
    return this.projectService.createInvitationLink(id, user);
  }

  @Post('/:id/join')
  joinProject(@Param('id') id: string, @GetUser() user: User) {
    return this.projectService.joinProject(id, user);
  }

  @Patch('/:projectId/user/:userId')
  ban(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
    @GetUser() user: User,
  ) {
    return this.projectService.ban(projectId, userId, user);
  }

  @Patch('/:id')
  rename(
    @Param('id') id: string,
    @Body() dto: projectDTO,
    @GetUser() user: User,
  ) {
    return this.projectService.rename(dto, id, user);
  }

  @Patch('/:id/delete')
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.projectService.remove(id, user);
  }

  @UseGuards(AdminGuard)
  @Delete('/admin/:id')
  removeByAdmin(@Param('id') id: string) {
    return this.projectService.removeByAdmin(id);
  }
}
