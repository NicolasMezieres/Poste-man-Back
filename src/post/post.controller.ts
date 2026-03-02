import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { PostService } from './post.service';
import { GetUser } from 'src/auth/decorator';
import { User } from 'src/prisma/generated';
import { JwtGuard } from 'src/auth/Guards';
import { postDTO, voteDTO } from './dto';
import { UserWithRole } from 'src/utils/type';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { movePostDTO } from './dto/move.post.dto';

@UseGuards(JwtGuard)
@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @ApiOkResponse({ description: 'Tous les postes de la section' })
  @ApiNotFoundResponse({ description: 'Section introuvable !' })
  @ApiForbiddenResponse({ description: "Vous n'êtes pas autoriser !" })
  @Get('/section/:sectionId')
  posts(@Param('sectionId') sectionId: string, @GetUser() user: UserWithRole) {
    return this.postService.posts(sectionId, user);
  }

  @ApiCreatedResponse({ description: 'Post créer !' })
  @ApiNotFoundResponse({ description: 'Section introuvable' })
  @ApiForbiddenResponse({ description: "Vous n'êtes pas autoriser !" })
  @Post('/section/:sectionId')
  create(
    @Param('sectionId') sectionId: string,
    @GetUser() user: User,
    @Body() dto: postDTO,
  ) {
    return this.postService.create(sectionId, dto, user);
  }

  @ApiOkResponse({ description: 'Post modifier !' })
  @ApiNotFoundResponse({ description: 'Post introuvable !' })
  @ApiForbiddenResponse({
    description: "Vous n'êtes pas autoriser !",
  })
  @Patch('/:postId')
  update(
    @Param('postId') postId: string,
    @GetUser() user: User,
    @Body() dto: postDTO,
  ) {
    return this.postService.update(postId, dto, user);
  }

  @ApiOkResponse({ description: 'Post mis à jour' })
  @ApiNotFoundResponse({ description: 'Post introuvable !' })
  @ApiForbiddenResponse({
    description: "Vous n'êtes pas membre du projet !",
  })
  @Patch('/:postId/move')
  move(
    @Param('postId') postId: string,
    @GetUser() user: User,
    @Body() dto: movePostDTO,
  ) {
    return this.postService.movePost(postId, dto, user);
  }

  @ApiOkResponse({ description: 'Post transferer !' })
  @ApiNotFoundResponse({
    description: 'Post ou Section introuvable !',
  })
  @ApiBadRequestResponse({ description: 'Post déjà dans la section' })
  @ApiForbiddenResponse({
    description:
      "Le projet n'est pas le même que celui de la section ou vous n'êtes pas autorisé(e)",
  })
  @Patch('/:postId/transfert/:sectionId')
  transfert(
    @Param('postId') postId: string,
    @Param('sectionId') sectionId: string,
    @GetUser() user: UserWithRole,
  ) {
    return this.postService.transfert(postId, sectionId, user);
  }

  @ApiOkResponse({ description: 'Les posts ont changées de section !' })
  @ApiBadRequestResponse({ description: 'Une autre section est nécessaire !' })
  @ApiNotFoundResponse({ description: "Une section n'a pas été trouvé" })
  @ApiForbiddenResponse({
    description:
      "Les sections ne sont pas dans le même projet ou Vous n'êtes pas autorisé(e) !",
  })
  @Patch('/section/:sectionId/transfert/:moveSectionId')
  transfertAll(
    @Param('sectionId') sectionId: string,
    @Param('moveSectionId') moveSectionId: string,
    @GetUser() user: UserWithRole,
  ) {
    return this.postService.transfertAll(sectionId, moveSectionId, user);
  }

  @ApiOkResponse({ description: 'Voté !' })
  @ApiNotFoundResponse({ description: 'Post introuvable!' })
  @ApiForbiddenResponse({ description: "Vous n'êtes pas autorisé(e) !" })
  @Put('/:postId/vote')
  vote(
    @Param('postId') postId: string,
    @Body() dto: voteDTO,
    @GetUser() user: User,
  ) {
    return this.postService.vote(postId, dto, user);
  }

  @ApiOkResponse({ description: 'Post supprimer !' })
  @ApiNotFoundResponse({ description: 'Post introuvable !' })
  @ApiForbiddenResponse({ description: "Vous n'êtes pas autorisé(e)!" })
  @Delete('/:postId')
  remove(@Param('postId') postId: string, @GetUser() user: UserWithRole) {
    return this.postService.remove(postId, user);
  }

  @ApiOkResponse({ description: 'Tout les posts on été supprimer !' })
  @ApiNotFoundResponse({ description: 'Section introuvable !' })
  @ApiForbiddenResponse({ description: "Vous n'êtes pas autorisé(e) !" })
  @Delete('/section/:sectionId')
  removeAll(
    @Param('sectionId') sectionId: string,
    @GetUser() user: UserWithRole,
  ) {
    return this.postService.removeAll(sectionId, user);
  }
}
