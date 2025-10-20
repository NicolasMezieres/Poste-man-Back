import { Test, TestingModule } from '@nestjs/testing';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { postServiceMock } from './mock/post.service.mock';
import { userMock, userWithRoleMock } from 'src/auth/mock/auth.mock';
import { postMock } from './mock/post.mock';

describe('PostController', () => {
  let controller: PostController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostController],
      providers: [{ provide: PostService, useValue: postServiceMock }],
    }).compile();

    controller = module.get<PostController>(PostController);
  });
  const sectionId = 'sectionId';
  const postDTO = { text: 'text post' };
  const postId = 'postId';
  const voteDTO = { isUp: true };
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  describe('Get Posts of Section', () => {
    it('Should return Posts of Section', async () => {
      await expect(
        controller.posts(sectionId, userWithRoleMock),
      ).resolves.toEqual({
        data: [postMock],
      });
    });
  });

  describe('Create post', () => {
    it('Should return a message', async () => {
      await expect(
        controller.create(sectionId, userMock, postDTO),
      ).resolves.toEqual({
        message: 'Post created !',
      });
    });
  });

  describe('Update post', () => {
    it('Should return a message', async () => {
      await expect(
        controller.update(postId, userMock, postDTO),
      ).resolves.toEqual({
        message: 'Post updated !',
      });
    });
  });

  describe('Move post', () => {
    it('Should return a message', async () => {
      await expect(
        controller.move(postId, sectionId, userWithRoleMock),
      ).resolves.toEqual({ message: 'Section of post changed !' });
    });
  });

  describe('Vote post', () => {
    it('Should return a message', async () => {
      await expect(controller.vote(postId, voteDTO, userMock)).resolves.toEqual(
        {
          message: 'Voted !',
        },
      );
    });
  });

  describe('Remove post', () => {
    it('Should return a message', async () => {
      await expect(
        controller.remove(postId, userWithRoleMock),
      ).resolves.toEqual({
        message: 'Post deleted !',
      });
    });
  });
});
