import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GetUser } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/Guards';
import { User } from 'src/prisma/generated';
import { createDTO, updateDTO } from './dto';
import { SectionService } from './section.service';

@UseGuards(JwtGuard)
@Controller('section')
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  @Get('/project/:projectId/all')
  allSectionProject() {
    return this.sectionService.allSectionProject();
  }

  @Post('project/:projectId/create')
  createSection(
    @Body() dto: createDTO,
    @Param('projectId') projectId: string,
    @GetUser() user: User,
  ) {
    return this.sectionService.createSection(dto, projectId, user);
  }

  @Patch(':sectionId/project/:projectId')
  updateSection(
    @Body() dto: updateDTO,
    @Param('projectId') projectId: string,
    @Param('sectionId') sectionId: string,
    @GetUser() user: User,
  ) {
    return this.sectionService.updateSection(dto, projectId, sectionId, user);
  }

  @Patch(':sectionId/update/project/:projectId')
  removeSection(
    @Param('projectId') projectId: string,
    @Param('sectionId') sectionId: string,
    @GetUser() user: User,
  ) {
    return this.sectionService.removeSection(projectId, sectionId, user);
  }
}
