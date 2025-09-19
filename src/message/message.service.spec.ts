import { Test, TestingModule } from '@nestjs/testing';
import { MessageService } from './message.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { messagePrismaMock } from './mock/message.prisma.mock';
import { userMock } from 'src/auth/mock/auth.mock';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('MessageService', () => {
  let service: MessageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageService,
        { provide: PrismaService, useValue: messagePrismaMock },
      ],
    }).compile();

    service = module.get<MessageService>(MessageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  const projectId = '1';
  const messages = {
    id: '1',
    message: 'text',
    createdAt: '19/09/2025',
    updatedAt: '19/09/2025',
    user: { username: 'username' },
  };
  describe('Project messages', () => {
    it("should return project's messages", async () => {
      jest
        .spyOn(messagePrismaMock.message, 'findMany')
        .mockResolvedValue(messages);
      await expect(
        service.projectMessages(projectId, userMock),
      ).resolves.toEqual({ data: messages });
    });
    it('should return a Not Found Exception', async () => {
      jest
        .spyOn(messagePrismaMock.message, 'findMany')
        .mockResolvedValue(undefined);
      await expect(
        service.projectMessages(projectId, userMock),
      ).rejects.toEqual(new NotFoundException('Project not found !'));
    });
  });
  describe('Project messages Admin', () => {
    it("should return project's messages with admin account", async () => {
      jest
        .spyOn(messagePrismaMock.message, 'findMany')
        .mockResolvedValue(messages);
      await expect(service.projectMessagesAdmin(projectId)).resolves.toEqual({
        data: messages,
      });
    });
    it('should return a Not Found Exception', async () => {
      jest
        .spyOn(messagePrismaMock.message, 'findMany')
        .mockResolvedValue(undefined);
      await expect(service.projectMessagesAdmin(projectId)).rejects.toEqual(
        new NotFoundException('Project not found !'),
      );
    });
  });
  describe('Create Message', () => {
    const messageDTO = { message: 'text' };
    it('should return Message created !', async () => {
      jest
        .spyOn(messagePrismaMock.project, 'findUnique')
        .mockResolvedValue({ id: '1' });
      await expect(
        service.createMessage(messageDTO, projectId, userMock),
      ).resolves.toEqual({
        message: 'Message created !',
      });
      expect(messagePrismaMock.message.create).toHaveBeenCalledWith({
        data: {
          ...messageDTO,
          projectId,
          authorId: userMock.id,
        },
        select: null,
      });
    });
    it('should return Not Found Exception', async () => {
      jest
        .spyOn(messagePrismaMock.project, 'findUnique')
        .mockResolvedValue(undefined);
      await expect(
        service.createMessage(messageDTO, projectId, userMock),
      ).rejects.toEqual(new NotFoundException('Project not found !'));
    });
  });
  describe('Delete Message', () => {
    const messageId = '1';
    it('should return Message deleted !', async () => {
      jest
        .spyOn(messagePrismaMock.message, 'findFirst')
        .mockResolvedValue({ id: messageId });
      await expect(service.deleteMessage(messageId, userMock)).resolves.toEqual(
        {
          message: 'Message deleted !',
        },
      );
      expect(messagePrismaMock.message.delete).toHaveBeenCalledWith({
        where: {
          id: messageId,
        },
      });
    });
    it('should return Not Found Exception', async () => {
      jest
        .spyOn(messagePrismaMock.message, 'findFirst')
        .mockResolvedValue(undefined);
      await expect(service.deleteMessage(messageId, userMock)).rejects.toEqual(
        new NotFoundException('Message not found !'),
      );
    });
  });
  describe('Delete All Message', () => {
    it('should return Messages deleted !', async () => {
      jest
        .spyOn(messagePrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue({ id: '1' });
      await expect(
        service.deleteAllMessage(projectId, userMock),
      ).resolves.toEqual({
        message: 'Messages deleted !',
      });
      expect(messagePrismaMock.message.deleteMany).toHaveBeenCalledWith({
        where: {
          projectId,
        },
      });
    });
    it('should return Not Found Exception', async () => {
      jest
        .spyOn(messagePrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue(undefined);
      await expect(
        service.deleteAllMessage(projectId, userMock),
      ).rejects.toEqual(
        new ForbiddenException("You doesn't have access to this action !"),
      );
    });
  });
});
