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

@UseGuards(JwtGuard)
@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}
  @Get('/section/:sectionId')
  posts(@Param('sectionId') sectionId: string, @GetUser() user: UserWithRole) {
    return this.postService.posts(sectionId, user);
  }

  @Post('/section/:sectionId')
  create(
    @Param('sectionId') sectionId: string,
    @GetUser() user: User,
    @Body() dto: postDTO,
  ) {
    return this.postService.create(sectionId, dto, user);
  }

  @Patch('/:postId')
  update(
    @Param('postId') postId: string,
    @GetUser() user: User,
    @Body() dto: postDTO,
  ) {
    return this.postService.update(postId, dto, user);
  }

  @Patch('/:postId/move/:sectionId')
  move(
    @Param('postId') postId: string,
    @Param('sectionId') sectionId: string,
    @GetUser() user: UserWithRole,
  ) {
    return this.postService.move(postId, sectionId, user);
  }

  @Patch('/section/:sectionId/move/:moveSectionId')
  moveAll(
    @Param('sectionId') sectionId: string,
    @Param('moveSectionId') moveSectionId: string,
    @GetUser() user: UserWithRole,
  ) {
    return this.postService.moveAll(sectionId, moveSectionId, user);
  }

  @Put('/:postId/vote')
  vote(
    @Param('postId') postId: string,
    @Body() dto: voteDTO,
    @GetUser() user: User,
  ) {
    return this.postService.vote(postId, dto, user);
  }

  @Delete('/:postId')
  remove(@Param('postId') postId: string, @GetUser() user: UserWithRole) {
    return this.postService.remove(postId, user);
  }
  @Delete('/section/:sectionId')
  removeAll(
    @Param('sectionId') sectionId: string,
    @GetUser() user: UserWithRole,
  ) {
    return this.postService.removeAll(sectionId, user);
  }
}
