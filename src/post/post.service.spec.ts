import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { postPrismaMock } from './mock/post.prisma.mock';
import { postMock } from './mock/post.mock';
import {
  adminWithRoleMock,
  userMock,
  userWithRoleMock,
} from 'src/auth/mock/auth.mock';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { roleProject } from 'src/section/mock/section.mock';

describe('PostService', () => {
  let service: PostService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        { provide: PrismaService, useValue: postPrismaMock },
      ],
    }).compile();
    service = module.get<PostService>(PostService);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  const projectId = 'projectId';
  const sectionId = 'sectionId';
  const postId = 'postId';
  const postDTOMock = { text: 'text post' };
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('Get Posts of Section', () => {
    const sectionMock = { post: { ...postMock }, id: 'sectionId', projectId };
    it('Should return Posts of Section with user', async () => {
      jest
        .spyOn(postPrismaMock.section, 'findUnique')
        .mockResolvedValue(sectionMock);
      jest
        .spyOn(postPrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue({ role: { name: 'userProjectId' } });
      await expect(service.posts(sectionId, userWithRoleMock)).resolves.toEqual(
        {
          data: sectionMock.post,
          isAdmin: false,
          isModerator: false,
          user: userWithRoleMock.username,
        },
      );
    });
    it('Should return Posts of Section with Admin', async () => {
      jest
        .spyOn(postPrismaMock.section, 'findUnique')
        .mockResolvedValue(sectionMock);
      jest
        .spyOn(postPrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue(null);
      await expect(
        service.posts(sectionId, adminWithRoleMock),
      ).resolves.toEqual({
        data: sectionMock.post,
        isAdmin: true,
        isModerator: false,
        user: adminWithRoleMock.username,
      });
    });
    it('Should return a Not Found Exception, Section not found', async () => {
      jest.spyOn(postPrismaMock.section, 'findUnique').mockResolvedValue(null);
      await expect(service.posts(sectionId, userWithRoleMock)).rejects.toEqual(
        new NotFoundException('Section not found !'),
      );
    });
    it('Should return a Forbidden Exception, You are unauthorized !', async () => {
      jest
        .spyOn(postPrismaMock.section, 'findUnique')
        .mockResolvedValue(sectionMock);
      jest
        .spyOn(postPrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue(null);
      await expect(service.posts(sectionId, userWithRoleMock)).rejects.toEqual(
        new ForbiddenException('You are unauthorized !'),
      );
    });
  });
  describe('Create post', () => {
    it('Should return a message', async () => {
      jest
        .spyOn(postPrismaMock.section, 'findUnique')
        .mockResolvedValue({ id: sectionId, projectId });
      jest
        .spyOn(postPrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue({ id: 'userProjectId' });
      jest.spyOn(postPrismaMock.post, 'create').mockResolvedValue(null);
      await expect(
        service.create(sectionId, postDTOMock, userMock),
      ).resolves.toEqual({ message: 'Post created !' });
    });
    it('Should return a Not Found Exception Section not found', async () => {
      jest.spyOn(postPrismaMock.section, 'findUnique').mockResolvedValue(null);
      await expect(
        service.create(sectionId, postDTOMock, userMock),
      ).rejects.toEqual(new NotFoundException('Section not found'));
    });
    it('Should return a Forbidden Exception You are unauthorized !', async () => {
      jest
        .spyOn(postPrismaMock.section, 'findUnique')
        .mockResolvedValue({ id: sectionId, projectId });
      jest
        .spyOn(postPrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue(null);
      await expect(
        service.create(sectionId, postDTOMock, userMock),
      ).rejects.toEqual(new ForbiddenException('You are unauthorized !'));
    });
  });
  describe('Update post', () => {
    it('Should return a message Post updated !', async () => {
      jest
        .spyOn(postPrismaMock.post, 'findUnique')
        .mockResolvedValue({ userId: userMock.id, id: postId });
      jest.spyOn(postPrismaMock.post, 'update').mockResolvedValue(null);
      await expect(
        service.update(postId, postDTOMock, userMock),
      ).resolves.toEqual({ message: 'Post updated !' });
      expect(postPrismaMock.post.update).toHaveBeenCalled();
    });
    it('Should return a Forbidden Exception Post not found !', async () => {
      jest.spyOn(postPrismaMock.post, 'findUnique').mockResolvedValue(null);
      await expect(
        service.update(postId, postDTOMock, userMock),
      ).rejects.toEqual(new NotFoundException('Post not found !'));
      expect(postPrismaMock.post.update).not.toHaveBeenCalled();
    });
    it('Should return a Forbidden Exception You are unauthorized !', async () => {
      jest
        .spyOn(postPrismaMock.post, 'findUnique')
        .mockResolvedValue({ userId: 'otherUserId', id: postId });
      await expect(
        service.update(postId, postDTOMock, userMock),
      ).rejects.toEqual(new ForbiddenException('You are unauthorized !'));
      expect(postPrismaMock.post.update).not.toHaveBeenCalled();
    });
  });

  describe('Move post', () => {
    it('Should return a message Section of post changed with User account !', async () => {
      jest.spyOn(postPrismaMock.post, 'findUnique').mockResolvedValue({
        sectionId,
        id: postId,
        userId: userWithRoleMock.id,
        section: { projectId },
      });
      jest
        .spyOn(postPrismaMock.section, 'findUnique')
        .mockResolvedValue({ projectId, id: 'otherSectionId' });
      jest
        .spyOn(postPrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue(null);
      jest.spyOn(postPrismaMock.post, 'update').mockResolvedValue(null);
      await expect(
        service.move(postId, 'otherSectionId', userWithRoleMock),
      ).resolves.toEqual({ message: 'Section of post changed !' });
      expect(postPrismaMock.post.update).toHaveBeenCalled();
    });
    it('Should return a message Section of post changed with Moderator account !', async () => {
      jest.spyOn(postPrismaMock.post, 'findUnique').mockResolvedValue({
        sectionId,
        id: postId,
        userId: userWithRoleMock.id,
        section: { projectId },
      });
      jest
        .spyOn(postPrismaMock.section, 'findUnique')
        .mockResolvedValue({ projectId, id: 'otherSectionId' });
      jest
        .spyOn(postPrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue({ id: 'userProjectId' });
      jest.spyOn(postPrismaMock.post, 'update').mockResolvedValue(null);
      await expect(
        service.move(postId, 'otherSectionId', userWithRoleMock),
      ).resolves.toEqual({ message: 'Section of post changed !' });
      expect(postPrismaMock.post.update).toHaveBeenCalled();
    });
    it('Should return a message Section of post changed with Admin account !', async () => {
      jest.spyOn(postPrismaMock.post, 'findUnique').mockResolvedValue({
        sectionId,
        id: postId,
        userId: adminWithRoleMock.id,
        section: { projectId },
      });
      jest
        .spyOn(postPrismaMock.section, 'findUnique')
        .mockResolvedValue({ projectId, id: 'otherSectionId' });
      jest.spyOn(postPrismaMock.post, 'update').mockResolvedValue(null);
      await expect(
        service.move(postId, 'otherSectionId', adminWithRoleMock),
      ).resolves.toEqual({ message: 'Section of post changed !' });
      expect(postPrismaMock.post.update).toHaveBeenCalled();
      expect(postPrismaMock.user_Has_Project.findFirst).not.toHaveBeenCalled();
    });
    it('Should return a Not Found Exception, Post not found !', async () => {
      jest.spyOn(postPrismaMock.post, 'findUnique').mockResolvedValue(null);
      await expect(
        service.move(postId, sectionId, userWithRoleMock),
      ).rejects.toEqual(new NotFoundException('Post not found !'));
      expect(postPrismaMock.post.update).not.toHaveBeenCalled();
    });
    it('Should return a Bad Request Exception, Post already in section', async () => {
      jest.spyOn(postPrismaMock.post, 'findUnique').mockResolvedValue({
        sectionId,
        id: postId,
        userId: userWithRoleMock.id,
        section: { projectId },
      });
      await expect(
        service.move(postId, sectionId, userWithRoleMock),
      ).rejects.toEqual(new BadRequestException('Post already in section'));
      expect(postPrismaMock.post.update).not.toHaveBeenCalled();
    });
    it('Should return a Not Found Exception, Section not found !', async () => {
      jest.spyOn(postPrismaMock.post, 'findUnique').mockResolvedValue({
        sectionId,
        id: postId,
        userId: userWithRoleMock.id,
        section: { projectId },
      });
      jest.spyOn(postPrismaMock.section, 'findUnique').mockResolvedValue(null);
      await expect(
        service.move(postId, 'otherSectionId', userWithRoleMock),
      ).rejects.toEqual(new NotFoundException('Section not found !'));
      expect(postPrismaMock.post.update).not.toHaveBeenCalled();
    });
    it('Should return a ForbiddenException, Project is not the same project of section', async () => {
      jest.spyOn(postPrismaMock.post, 'findUnique').mockResolvedValue({
        sectionId,
        id: postId,
        userId: userWithRoleMock.id,
        section: { projectId },
      });
      jest.spyOn(postPrismaMock.section, 'findUnique').mockResolvedValue({
        projectId: 'otherProjectId',
        id: 'otherSectionId',
      });
      await expect(
        service.move(postId, 'otherSectionId', userWithRoleMock),
      ).rejects.toEqual(
        new ForbiddenException('Project is not the same project of section'),
      );
      expect(postPrismaMock.post.update).not.toHaveBeenCalled();
    });
    it('Should return a Forbidden Exception, You are not authorized', async () => {
      jest.spyOn(postPrismaMock.post, 'findUnique').mockResolvedValue({
        sectionId,
        id: postId,
        userId: 'otherUserId',
        section: { projectId },
      });
      jest
        .spyOn(postPrismaMock.section, 'findUnique')
        .mockResolvedValue({ projectId, id: 'otherSectionId' });
      jest
        .spyOn(postPrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue(null);
      await expect(
        service.move(postId, 'otherSectionId', userWithRoleMock),
      ).rejects.toEqual(new ForbiddenException('You are not authorized'));
      expect(postPrismaMock.post.update).not.toHaveBeenCalled();
    });
  });

  describe('Move all post to another section', () => {
    const otherSectionId = 'otherSectionId';
    it('Should change section of posts, Moderator account', async () => {
      jest
        .spyOn(postPrismaMock.section, 'findUnique')
        .mockResolvedValueOnce({ id: sectionId, projectId })
        .mockResolvedValueOnce({ id: otherSectionId, projectId });
      jest
        .spyOn(postPrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue({ id: 'userProjectId' });
      jest.spyOn(postPrismaMock.post, 'updateMany').mockResolvedValue(null);
      await expect(
        service.moveAll(sectionId, otherSectionId, userWithRoleMock),
      ).resolves.toEqual({ message: 'Posts changed section !' });
      expect(postPrismaMock.post.updateMany).toHaveBeenCalled();
    });
    it('Should change section of posts, Admin account', async () => {
      jest
        .spyOn(postPrismaMock.section, 'findUnique')
        .mockResolvedValueOnce({ id: sectionId, projectId })
        .mockResolvedValueOnce({ id: otherSectionId, projectId });
      jest.spyOn(postPrismaMock.post, 'updateMany').mockResolvedValue(null);
      await expect(
        service.moveAll(sectionId, otherSectionId, adminWithRoleMock),
      ).resolves.toEqual({ message: 'Posts changed section !' });
      expect(postPrismaMock.post.updateMany).toHaveBeenCalled();
    });
    it('Should return Bad Request Exception, Need to other section !', async () => {
      await expect(
        service.moveAll(sectionId, sectionId, userWithRoleMock),
      ).rejects.toEqual(new BadRequestException('Need to other section !'));
      expect(postPrismaMock.post.updateMany).not.toHaveBeenCalled();
    });
    it('Should return Not Found Exception, Section not found ! ', async () => {
      jest
        .spyOn(postPrismaMock.section, 'findUnique')
        .mockResolvedValueOnce(null);
      await expect(
        service.moveAll(sectionId, otherSectionId, userWithRoleMock),
      ).rejects.toEqual(new NotFoundException('Section not found !'));
      expect(postPrismaMock.post.updateMany).not.toHaveBeenCalled();
    });
    it('Should return Not Found Exception, Section to move not found ! ', async () => {
      jest
        .spyOn(postPrismaMock.section, 'findUnique')
        .mockResolvedValueOnce({ id: sectionId, projectId })
        .mockResolvedValueOnce(null);
      await expect(
        service.moveAll(sectionId, otherSectionId, userWithRoleMock),
      ).rejects.toEqual(new NotFoundException('Section to move not found !'));
      expect(postPrismaMock.post.updateMany).not.toHaveBeenCalled();
    });
    it('Should return Forbidden Exception, Section do not have the same project', async () => {
      jest
        .spyOn(postPrismaMock.section, 'findUnique')
        .mockResolvedValueOnce({ id: sectionId, projectId })
        .mockResolvedValueOnce({
          id: otherSectionId,
          projectId: 'otherProjectId',
        });
      await expect(
        service.moveAll(sectionId, otherSectionId, userWithRoleMock),
      ).rejects.toEqual(
        new ForbiddenException('Sections do not have the same project'),
      );
      expect(postPrismaMock.post.updateMany).not.toHaveBeenCalled();
    });
    it('Should return Forbidden Exception, You are unauthorized !', async () => {
      jest
        .spyOn(postPrismaMock.section, 'findUnique')
        .mockResolvedValueOnce({ id: sectionId, projectId })
        .mockResolvedValueOnce({ id: otherSectionId, projectId });
      jest
        .spyOn(postPrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue(null);
      jest.spyOn(postPrismaMock.post, 'updateMany').mockResolvedValue(null);
      await expect(
        service.moveAll(sectionId, otherSectionId, userWithRoleMock),
      ).rejects.toEqual(new ForbiddenException('You are unauthorized !'));
      expect(postPrismaMock.post.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('Vote post', () => {
    const voteUpDTO = { isUp: true };
    const voteDownDTO = { isUp: false };
    it('Should increment 1 score when user vote up first time', async () => {
      jest
        .spyOn(postPrismaMock.post, 'findUnique')
        .mockResolvedValue({ id: postId, section: { projectId } });
      jest
        .spyOn(postPrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue({ id: 'userProjectId' });
      jest.spyOn(postPrismaMock.vote, 'findFirst').mockResolvedValue(null);
      jest.spyOn(postPrismaMock, '$transaction').mockResolvedValue(null);
      jest.spyOn(postPrismaMock.vote, 'create').mockResolvedValue(null);
      jest.spyOn(postPrismaMock.post, 'update').mockResolvedValue(null);
      await expect(service.vote(postId, voteUpDTO, userMock)).resolves.toEqual({
        message: 'Voted !',
      });
      expect(postPrismaMock.vote.create).toHaveBeenCalledWith({
        data: { ...voteUpDTO, postId, userId: userMock.id },
      });
      expect(postPrismaMock.post.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: { score: { increment: 1 } },
      });
    });
    it('Should decrement 1 score when user vote down first time', async () => {
      jest
        .spyOn(postPrismaMock.post, 'findUnique')
        .mockResolvedValue({ id: postId, section: { projectId } });
      jest
        .spyOn(postPrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue({ id: 'userProjectId' });
      jest.spyOn(postPrismaMock.vote, 'findFirst').mockResolvedValue(null);
      jest.spyOn(postPrismaMock, '$transaction').mockResolvedValue(null);
      jest.spyOn(postPrismaMock.vote, 'create').mockResolvedValue(null);
      jest.spyOn(postPrismaMock.post, 'update').mockResolvedValue(null);
      await expect(
        service.vote(postId, voteDownDTO, userMock),
      ).resolves.toEqual({
        message: 'Voted !',
      });
      expect(postPrismaMock.vote.create).toHaveBeenCalledWith({
        data: { ...voteDownDTO, postId, userId: userMock.id },
      });
      expect(postPrismaMock.post.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: { score: { decrement: 1 } },
      });
    });
    it('Should decrement 1 score when user cancel vote up', async () => {
      jest
        .spyOn(postPrismaMock.post, 'findUnique')
        .mockResolvedValue({ id: postId, section: { projectId } });
      jest
        .spyOn(postPrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue({ id: 'userProjectId' });
      jest
        .spyOn(postPrismaMock.vote, 'findFirst')
        .mockResolvedValue({ id: postId, isUp: true });
      jest.spyOn(postPrismaMock.post, 'update').mockResolvedValue(null);
      await expect(service.vote(postId, voteUpDTO, userMock)).resolves.toEqual({
        message: 'Voted !',
      });
      expect(postPrismaMock.vote.create).not.toHaveBeenCalled();
      expect(postPrismaMock.vote.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: { isUp: null, post: { update: { score: { decrement: 1 } } } },
      });
    });
    it('Should increment 1 score when user cancel vote down', async () => {
      jest
        .spyOn(postPrismaMock.post, 'findUnique')
        .mockResolvedValue({ id: postId, section: { projectId } });
      jest
        .spyOn(postPrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue({ id: 'userProjectId' });
      jest
        .spyOn(postPrismaMock.vote, 'findFirst')
        .mockResolvedValue({ id: postId, isUp: false });
      jest.spyOn(postPrismaMock.post, 'update').mockResolvedValue(null);
      await expect(
        service.vote(postId, voteDownDTO, userMock),
      ).resolves.toEqual({
        message: 'Voted !',
      });
      expect(postPrismaMock.vote.create).not.toHaveBeenCalled();
      expect(postPrismaMock.vote.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: { isUp: null, post: { update: { score: { increment: 1 } } } },
      });
    });
    it('Should increment 2 score when user change vote down to up ', async () => {
      jest
        .spyOn(postPrismaMock.post, 'findUnique')
        .mockResolvedValue({ id: postId, section: { projectId } });
      jest
        .spyOn(postPrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue({ id: 'userProjectId' });
      jest
        .spyOn(postPrismaMock.vote, 'findFirst')
        .mockResolvedValue({ id: postId, isUp: false });
      jest.spyOn(postPrismaMock.post, 'update').mockResolvedValue(null);
      await expect(service.vote(postId, voteUpDTO, userMock)).resolves.toEqual({
        message: 'Voted !',
      });
      expect(postPrismaMock.vote.create).not.toHaveBeenCalled();
      expect(postPrismaMock.vote.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: { isUp: true, post: { update: { score: { increment: 2 } } } },
      });
    });
    it('Should decrement 2 score when user change vote up to down', async () => {
      jest
        .spyOn(postPrismaMock.post, 'findUnique')
        .mockResolvedValue({ id: postId, section: { projectId } });
      jest
        .spyOn(postPrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue({ id: 'userProjectId' });
      jest
        .spyOn(postPrismaMock.vote, 'findFirst')
        .mockResolvedValue({ id: postId, isUp: true });
      jest.spyOn(postPrismaMock.post, 'update').mockResolvedValue(null);
      await expect(
        service.vote(postId, voteDownDTO, userMock),
      ).resolves.toEqual({
        message: 'Voted !',
      });
      expect(postPrismaMock.vote.create).not.toHaveBeenCalled();
      expect(postPrismaMock.vote.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: { isUp: false, post: { update: { score: { decrement: 2 } } } },
      });
    });
    it('Should increment 1 score when user change vote cancel to up', async () => {
      jest
        .spyOn(postPrismaMock.post, 'findUnique')
        .mockResolvedValue({ id: postId, section: { projectId } });
      jest
        .spyOn(postPrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue({ id: 'userProjectId' });
      jest
        .spyOn(postPrismaMock.vote, 'findFirst')
        .mockResolvedValue({ id: postId, isUp: null });
      jest.spyOn(postPrismaMock.post, 'update').mockResolvedValue(null);
      await expect(service.vote(postId, voteUpDTO, userMock)).resolves.toEqual({
        message: 'Voted !',
      });
      expect(postPrismaMock.vote.create).not.toHaveBeenCalled();
      expect(postPrismaMock.vote.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: { isUp: true, post: { update: { score: { increment: 1 } } } },
      });
    });
    it('Should decrement 1 score when user change vote cancel to down', async () => {
      jest
        .spyOn(postPrismaMock.post, 'findUnique')
        .mockResolvedValue({ id: postId, section: { projectId } });
      jest
        .spyOn(postPrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue({ id: 'userProjectId' });
      jest
        .spyOn(postPrismaMock.vote, 'findFirst')
        .mockResolvedValue({ id: postId, isUp: null });
      jest.spyOn(postPrismaMock.post, 'update').mockResolvedValue(null);
      await expect(
        service.vote(postId, voteDownDTO, userMock),
      ).resolves.toEqual({
        message: 'Voted !',
      });
      expect(postPrismaMock.vote.create).not.toHaveBeenCalled();
      expect(postPrismaMock.vote.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: { isUp: false, post: { update: { score: { decrement: 1 } } } },
      });
    });
    it('Should return a Not Found Exception, Post not found !', async () => {
      jest.spyOn(postPrismaMock.post, 'findUnique').mockResolvedValue(null);
      await expect(service.vote(postId, voteDownDTO, userMock)).rejects.toEqual(
        new NotFoundException('Post not found !'),
      );
    });
    it('Should return a Forbidden Exception, You are unauthorized !', async () => {
      jest
        .spyOn(postPrismaMock.post, 'findUnique')
        .mockResolvedValue({ id: postId, section: { projectId } });
      jest
        .spyOn(postPrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue(null);
      await expect(service.vote(postId, voteDownDTO, userMock)).rejects.toEqual(
        new ForbiddenException('You are unauthorized !'),
      );
    });
  });

  describe('Remove post', () => {
    it('Should return a message, Post deleted ! Member account', async () => {
      jest.spyOn(postPrismaMock.post, 'findUnique').mockResolvedValue({
        id: postId,
        section: { projectId },
        userId: userWithRoleMock.id,
      });
      jest.spyOn(postPrismaMock.post, 'update').mockResolvedValue(null);
      await expect(service.remove(postId, userWithRoleMock)).resolves.toEqual({
        message: 'Post deleted !',
      });
      expect(postPrismaMock.user_Has_Project.findFirst).not.toHaveBeenCalled();
    });
    it('Should return a message, Post deleted ! Moderator account', async () => {
      jest.spyOn(postPrismaMock.post, 'findUnique').mockResolvedValue({
        id: postId,
        section: { projectId },
        userId: 'otherUserId',
      });
      jest
        .spyOn(postPrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue({ id: 'userProjectId' });
      jest.spyOn(postPrismaMock.post, 'update').mockResolvedValue(null);
      await expect(service.remove(postId, userWithRoleMock)).resolves.toEqual({
        message: 'Post deleted !',
      });
      expect(postPrismaMock.user_Has_Project.findFirst).toHaveBeenCalledWith({
        where: {
          projectId,
          userId: userWithRoleMock.id,
          role: { name: roleProject.MODERATOR },
        },
        select: { id: true },
      });
    });
    it('Should return a message, Post deleted ! Admin account', async () => {
      jest.spyOn(postPrismaMock.post, 'findUnique').mockResolvedValue({
        id: postId,
        section: { projectId },
        userId: userWithRoleMock.id,
      });
      jest.spyOn(postPrismaMock.post, 'update').mockResolvedValue(null);
      await expect(service.remove(postId, adminWithRoleMock)).resolves.toEqual({
        message: 'Post deleted !',
      });
      expect(postPrismaMock.user_Has_Project.findFirst).not.toHaveBeenCalled();
    });
    it('Should return a Not Found Exception, Post not found !', async () => {
      jest.spyOn(postPrismaMock.post, 'findUnique').mockResolvedValue(null);

      await expect(service.remove(postId, userWithRoleMock)).rejects.toEqual(
        new NotFoundException('Post not found !'),
      );
      expect(postPrismaMock.post.update).not.toHaveBeenCalled();
    });
    it('Should return a Forbidden Exception, You are unauthorized !', async () => {
      jest.spyOn(postPrismaMock.post, 'findUnique').mockResolvedValue({
        id: postId,
        section: { projectId },
        userId: 'otherUserId',
      });
      jest
        .spyOn(postPrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue(null);
      await expect(service.remove(postId, userWithRoleMock)).rejects.toEqual(
        new ForbiddenException('You are unauthorized !'),
      );
      expect(postPrismaMock.post.update).not.toHaveBeenCalled();
    });
  });
  describe('Remove all post from section', () => {
    it('Should delete all post, Moderator account', async () => {
      jest.spyOn(postPrismaMock.section, 'findUnique').mockResolvedValue({
        id: sectionId,
        projectId,
      });
      jest
        .spyOn(postPrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue({ id: 'userProjectId' });
      await expect(
        service.removeAll(sectionId, userWithRoleMock),
      ).resolves.toEqual({ message: 'All post have been deleted !' });
      expect(postPrismaMock.post.updateMany).toHaveBeenCalled();
    });
    it('Should delete all post, Admin account', async () => {
      jest.spyOn(postPrismaMock.section, 'findUnique').mockResolvedValue({
        id: sectionId,
        projectId,
      });
      await expect(
        service.removeAll(sectionId, adminWithRoleMock),
      ).resolves.toEqual({ message: 'All post have been deleted !' });
      expect(postPrismaMock.post.updateMany).toHaveBeenCalled();
    });
    it('Should return Not Found Exception, Section not found ! ', async () => {
      jest.spyOn(postPrismaMock.section, 'findUnique').mockResolvedValue(null);
      await expect(
        service.removeAll(sectionId, userWithRoleMock),
      ).rejects.toEqual(new NotFoundException('Section not found !'));
      expect(postPrismaMock.post.updateMany).not.toHaveBeenCalled();
    });
    it('Should return Forbidden Exception, You are unauthorized ! ', async () => {
      jest.spyOn(postPrismaMock.section, 'findUnique').mockResolvedValue({
        id: sectionId,
        projectId,
      });
      jest
        .spyOn(postPrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue(null);
      await expect(
        service.removeAll(sectionId, userWithRoleMock),
      ).rejects.toEqual(new ForbiddenException('You are unauthorized !'));
      expect(postPrismaMock.post.updateMany).not.toHaveBeenCalled();
    });
  });
});
