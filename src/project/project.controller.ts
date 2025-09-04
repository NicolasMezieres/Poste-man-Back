import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { projectDTO } from './dto';
type querySearchProject = {
  page: number;
  search: string;
};
type querySearchAdminProject = {
  page: number;
  search: string;
  from: string;
  to: string;
};

@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}
  //todo: rajouter jwt User
  @Get('/search')
  search(@Query() query: querySearchProject) {
    return this.projectService.search(query);
  }
  @Get('/searchAdmin')
  searchByAdmin(@Query() query: querySearchAdminProject) {
    return this.projectService.searchByAdmin(query);
  }
  @Post('/create')
  create(@Body() dto: projectDTO) {
    return this.projectService.create(dto);
  }
  @Post('/:id/link')
  createInvitationLink(@Param('id') id: string) {
    return this.projectService.createInvitationLink(id);
  }
  @Post('/:id/join')
  joinProject(@Param('id') id: string) {
    return this.projectService.joinProject(id);
  }
  @Patch('/:id')
  rename(@Param('id') id: string, @Body() dto: projectDTO) {
    return this.projectService.rename(dto, id);
  }

  @Delete('/admin/:id')
  removeByAdmin(@Param('id') id: string) {
    return this.projectService.removeByAdmin(id);
  }
  @Delete('/:id')
  remove(@Param('id') id: string) {
    return this.projectService.remove(id);
  }
}
