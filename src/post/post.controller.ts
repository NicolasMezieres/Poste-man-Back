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
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from '@nestjs/swagger';

@UseGuards(JwtGuard)
@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}
  @ApiOkResponse({ description: 'Show all post of the section' })
  @ApiNotFoundResponse({ description: 'Section not found !' })
  @ApiForbiddenResponse({ description: 'You are unauthorized !' })
  @Get('/section/:sectionId')
  posts(@Param('sectionId') sectionId: string, @GetUser() user: UserWithRole) {
    return this.postService.posts(sectionId, user);
  }

  @ApiCreatedResponse({ description: 'Post created !' })
  @ApiNotFoundResponse({ description: 'Section not found !' })
  @ApiForbiddenResponse({ description: 'You are unauthorized !' })
  @Post('/section/:sectionId')
  create(
    @Param('sectionId') sectionId: string,
    @GetUser() user: User,
    @Body() dto: postDTO,
  ) {
    return this.postService.create(sectionId, dto, user);
  }

  @ApiNoContentResponse({ description: 'Post updated !' })
  @ApiNotFoundResponse({ description: 'Post not found !' })
  @ApiForbiddenResponse({
    description: 'You are not the author of this post !',
  })
  @Patch('/:postId')
  update(
    @Param('postId') postId: string,
    @GetUser() user: User,
    @Body() dto: postDTO,
  ) {
    return this.postService.update(postId, dto, user);
  }

  @ApiNoContentResponse({ description: 'Section of post changed !' })
  @ApiNotFoundResponse({
    description: 'Post or Section not found !',
  })
  @ApiBadRequestResponse({ description: 'Post already in section' })
  @ApiForbiddenResponse({
    description:
      'Project is not the same project of section or you are unauthorized',
  })
  @Patch('/:postId/transfert/:sectionId')
  transfert(
    @Param('postId') postId: string,
    @Param('sectionId') sectionId: string,
    @GetUser() user: UserWithRole,
  ) {
    return this.postService.transfert(postId, sectionId, user);
  }

  @ApiNoContentResponse({ description: 'Posts changed section !' })
  @ApiBadRequestResponse({ description: 'Need an other section !' })
  @ApiNotFoundResponse({ description: 'Some section not found !' })
  @ApiForbiddenResponse({
    description: 'Sections not have the same project or you are unauthorized !',
  })
  @Patch('/section/:sectionId/transfert/:moveSectionId')
  transfertAll(
    @Param('sectionId') sectionId: string,
    @Param('moveSectionId') moveSectionId: string,
    @GetUser() user: UserWithRole,
  ) {
    return this.postService.transfertAll(sectionId, moveSectionId, user);
  }

  @ApiNoContentResponse({ description: 'Voted !' })
  @ApiNotFoundResponse({ description: 'Post not found !' })
  @ApiForbiddenResponse({ description: 'You are unauthorized !' })
  @Put('/:postId/vote')
  vote(
    @Param('postId') postId: string,
    @Body() dto: voteDTO,
    @GetUser() user: User,
  ) {
    return this.postService.vote(postId, dto, user);
  }

  @ApiNoContentResponse({ description: 'Post deleted !' })
  @ApiNotFoundResponse({ description: 'Post not found !' })
  @ApiForbiddenResponse({ description: 'You are unauthorized !' })
  @Delete('/:postId')
  remove(@Param('postId') postId: string, @GetUser() user: UserWithRole) {
    return this.postService.remove(postId, user);
  }

  @ApiNoContentResponse({ description: 'All post have been deleted !' })
  @ApiNotFoundResponse({ description: 'Section not found !' })
  @ApiForbiddenResponse({ description: 'You are unauthorized !' })
  @Delete('/section/:sectionId')
  removeAll(
    @Param('sectionId') sectionId: string,
    @GetUser() user: UserWithRole,
  ) {
    return this.postService.removeAll(sectionId, user);
  }
}
