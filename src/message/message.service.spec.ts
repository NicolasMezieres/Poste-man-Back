import { Test, TestingModule } from '@nestjs/testing';
import { MessageService } from './message.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { messagePrismaMock } from './mock/message.prisma.mock';
import { userMock } from 'src/auth/mock/auth.mock';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MessageGateway } from './message.gateway';
import { messageGatewayMock } from './mock/message.gateway.mock';
import { socketMock } from './mock/socket.mock';
import { WsException } from '@nestjs/websockets';

describe('MessageService', () => {
  let service: MessageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageService,
        { provide: PrismaService, useValue: messagePrismaMock },
        { provide: MessageGateway, useValue: messageGatewayMock },
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
    // it('should return a Not Found Exception', async () => {
    //   jest
    //     .spyOn(messagePrismaMock.message, 'findMany')
    //     .mockResolvedValue(undefined);
    //   await expect(
    //     service.projectMessages(projectId, userMock),
    //   ).rejects.toEqual(new NotFoundException('Project not found !'));
    // });
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
    // it('should return a Not Found Exception', async () => {
    //   jest
    //     .spyOn(messagePrismaMock.message, 'findMany')
    //     .mockResolvedValue(undefined);
    //   await expect(service.projectMessagesAdmin(projectId)).rejects.toEqual(
    //     new NotFoundException('Project not found !'),
    //   );
    // });
  });
  describe('Create Message', () => {
    const messageDTO = { message: 'text' };
    it('should return Message created !', async () => {
      jest
        .spyOn(messagePrismaMock.project, 'findUnique')
        .mockResolvedValue({ id: '1' });
      const newMessage = await expect(
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
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          projectId: true,
          message: true,
          user: {
            select: {
              username: true,
            },
          },
        },
      });
      expect(messageGatewayMock.emitNewMessage).toHaveBeenCalledWith(
        newMessage,
        projectId,
      );
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
      const existingMessage = { id: '1', projectId: '1' };
      jest
        .spyOn(messagePrismaMock.message, 'findFirst')
        .mockResolvedValue(existingMessage);
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
      expect(messageGatewayMock.emitDeleteMessage).toHaveBeenCalledWith(
        existingMessage.id,
        existingMessage.projectId,
      );
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
      expect(messageGatewayMock.emitResetMessage).toHaveBeenCalledWith(
        projectId,
      );
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
  describe('Join Room Message', () => {
    it('should join rooom', async () => {
      jest
        .spyOn(messagePrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue({ id: '1' });
      await expect(
        service.joinRoomMessage(socketMock, projectId, userMock),
      ).resolves.toEqual(undefined);
      expect(socketMock.join).toHaveBeenCalledWith(projectId);
    });
    it('should return WsException You arent a member !', async () => {
      jest
        .spyOn(messagePrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue(undefined);
      await expect(
        service.joinRoomMessage(socketMock, projectId, userMock),
      ).rejects.toEqual(new WsException("You aren't a member !"));
    });
  });
});
