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
import { User } from 'src/prisma/generated';
import { createDTO, updateDTO } from './dto';
import { SectionService } from './section.service';
import { UserWithRole } from 'src/utils/type';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

@UseGuards(JwtGuard)
@Controller('section')
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  @ApiOkResponse({ description: 'Sections du projet' })
  @ApiNotFoundResponse({ description: 'Projet introuvable !' })
  @ApiForbiddenResponse({ description: "Vous n'êtes pas autorisé" })
  @Get('/project/:projectId')
  sections(
    @Param('projectId') projectId: string,
    @GetUser() user: UserWithRole,
  ) {
    return this.sectionService.sections(projectId, user);
  }

  @ApiCreatedResponse({ description: 'Section créé' })
  @ApiBadRequestResponse({ description: 'Ce nom de section est déjà utilisé' })
  @ApiNotFoundResponse({ description: 'Projet introuvable' })
  @Post('project/:projectId/create')
  createSection(
    @Body() dto: createDTO,
    @Param('projectId') projectId: string,
    @GetUser() user: User,
  ) {
    return this.sectionService.createSection(dto, projectId, user);
  }
  @ApiOkResponse({ description: 'Section modifié' })
  @ApiNotFoundResponse({ description: 'Section introuvable' })
  @ApiForbiddenResponse({ description: 'Ce nom de section est déjà utilisé' })
  @Patch(':sectionId/project/:projectId')
  updateSection(
    @Body() dto: updateDTO,
    @Param('projectId') projectId: string,
    @Param('sectionId') sectionId: string,
    @GetUser() user: User,
  ) {
    return this.sectionService.updateSection(dto, projectId, sectionId, user);
  }

  @ApiOkResponse({ description: 'Section supprimé' })
  @ApiNotFoundResponse({ description: 'Section introuvable !' })
  @ApiForbiddenResponse({ description: "Vous n'êtes pas autorisé" })
  @Delete(':sectionId')
  removeSection(
    @Param('sectionId') sectionId: string,
    @GetUser() user: UserWithRole,
  ) {
    return this.sectionService.removeSection(sectionId, user);
  }

  @ApiOkResponse({ description: 'Sections supprimé avec succes !' })
  @ApiNotFoundResponse({ description: 'Projet introuvable' })
  @ApiForbiddenResponse({ description: "Vous n'êtes pas modérateur !" })
  @Delete('/project/:projectId')
  removeAllSection(
    @Param('projectId') projectId: string,
    @GetUser() user: UserWithRole,
  ) {
    return this.sectionService.removeAllSection(projectId, user);
  }
}
