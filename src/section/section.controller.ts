import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GetUser } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/Guards';
import { User } from 'src/prisma/generated/client';
import { createDTO, updateDTO } from './dto';
import { SectionService } from './section.service';
import { UserWithRole } from 'src/utils/type';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

@UseGuards(JwtGuard)
@Controller('section')
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  @ApiOkResponse({ description: 'Sections of project' })
  @ApiNotFoundResponse({ description: 'Project not found !' })
  @ApiForbiddenResponse({ description: 'You are unauthorized !' })
  @Get('/project/:projectId')
  sections(
    @Param('projectId') projectId: string,
    @GetUser() user: UserWithRole,
  ) {
    return this.sectionService.sections(projectId, user);
  }

  @ApiCreatedResponse({ description: 'Section created !' })
  @ApiBadRequestResponse({ description: 'This name is already used !' })
  @ApiForbiddenResponse({ description: 'Project not exist' })
  @Post('project/:projectId/create')
  createSection(
    @Body() dto: createDTO,
    @Param('projectId') projectId: string,
    @GetUser() user: User,
  ) {
    return this.sectionService.createSection(dto, projectId, user);
  }
  @ApiNoContentResponse({ description: 'Section updated !' })
  @ApiBadRequestResponse({ description: 'Not found section' })
  @ApiForbiddenResponse({ description: 'This name is already used' })
  @Patch(':sectionId/project/:projectId')
  updateSection(
    @Body() dto: updateDTO,
    @Param('projectId') projectId: string,
    @Param('sectionId') sectionId: string,
    @GetUser() user: User,
  ) {
    return this.sectionService.updateSection(dto, projectId, sectionId, user);
  }

  @ApiNoContentResponse({ description: 'Section has been deleted' })
  @ApiNotFoundResponse({ description: 'Section not found !' })
  @ApiForbiddenResponse({ description: 'You are unauthorized !' })
  @Delete(':sectionId')
  removeSection(
    @Param('sectionId') sectionId: string,
    @GetUser() user: UserWithRole,
  ) {
    return this.sectionService.removeSection(sectionId, user);
  }
}
