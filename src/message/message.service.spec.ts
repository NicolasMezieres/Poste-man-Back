import { Test, TestingModule } from '@nestjs/testing';
import { MessageService } from './message.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { messagePrismaMock } from './mock/message.prisma.mock';
import {
  adminWithRoleMock,
  userMock,
  userWithRoleMock,
} from 'src/auth/mock/auth.mock';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { MessageGateway } from './message.gateway';
import { messageGatewayMock } from './mock/message.gateway.mock';
import { socketMock } from './mock/socket.mock';
import { WsException } from '@nestjs/websockets';
import { roleProject } from 'src/utils/enum';
import { NotificationService } from 'src/notification/notification.service';
import { notificationServiceMock } from './mock/message.notification.mock';

describe('MessageService', () => {
  let service: MessageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageService,
        { provide: PrismaService, useValue: messagePrismaMock },
        { provide: MessageGateway, useValue: messageGatewayMock },
        { provide: NotificationService, useValue: notificationServiceMock },
      ],
    }).compile();

    service = module.get<MessageService>(MessageService);
  });
  afterEach(() => {
    jest.resetAllMocks();
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
    const query = { items: '0' };
    it("should return project's messages member", async () => {
      jest
        .spyOn(messagePrismaMock.project, 'findUnique')
        .mockResolvedValue({ id: projectId });
      jest
        .spyOn(messagePrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue({ role: { name: 'member' } });
      jest
        .spyOn(messagePrismaMock.message, 'findMany')
        .mockResolvedValue(messages);
      await expect(
        service.projectMessages(projectId, userWithRoleMock, query),
      ).resolves.toEqual({
        data: messages,
      });
    });
    it("should return project's messages", async () => {
      jest
        .spyOn(messagePrismaMock.project, 'findUnique')
        .mockResolvedValue({ id: projectId });
      jest
        .spyOn(messagePrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue({ role: { name: roleProject.MODERATOR } });
      jest
        .spyOn(messagePrismaMock.message, 'findMany')
        .mockResolvedValue(messages);
      await expect(
        service.projectMessages(projectId, userWithRoleMock, query),
      ).resolves.toEqual({
        data: messages,
      });
    });
    it("should return project's messages by admin", async () => {
      jest
        .spyOn(messagePrismaMock.project, 'findUnique')
        .mockResolvedValue({ id: projectId });
      jest
        .spyOn(messagePrismaMock.message, 'findMany')
        .mockResolvedValue(messages);
      await expect(
        service.projectMessages(projectId, adminWithRoleMock, query),
      ).resolves.toEqual({
        data: messages,
      });
    });
    it('should fail Unauthorized', async () => {
      jest
        .spyOn(messagePrismaMock.project, 'findUnique')
        .mockResolvedValue({ id: projectId });
      jest
        .spyOn(messagePrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue(null);
      await expect(
        service.projectMessages(projectId, userWithRoleMock, query),
      ).rejects.toEqual(new ForbiddenException('You are unauthorized !'));
    });
    it('should fail project not found', async () => {
      jest
        .spyOn(messagePrismaMock.project, 'findUnique')
        .mockResolvedValue(null);
      await expect(
        service.projectMessages(projectId, userWithRoleMock, query),
      ).rejects.toEqual(new NotFoundException('Project not found !'));
    });
  });
  describe('Project Name', () => {
    it('Should fail, project not found (404)', async () => {
      jest.spyOn(messagePrismaMock.project, 'findUnique').mockReturnValue(null);
      await expect(
        service.projectName(projectId, userWithRoleMock),
      ).rejects.toEqual(new NotFoundException('Project introuvable'));
    });
    it('Should fail, Not a member and admin', async () => {
      jest
        .spyOn(messagePrismaMock.project, 'findUnique')
        .mockReturnValue({ name: 'projectName' });
      jest
        .spyOn(messagePrismaMock.user_Has_Project, 'findFirst')
        .mockReturnValue(null);
      await expect(
        service.projectName(projectId, userWithRoleMock),
      ).rejects.toEqual(
        new ForbiddenException("Vous n'êtes pas dans le projet"),
      );
    });
    it('Should succes return project name (member)', async () => {
      jest
        .spyOn(messagePrismaMock.project, 'findUnique')
        .mockReturnValue({ name: 'projectName' });
      jest
        .spyOn(messagePrismaMock.user_Has_Project, 'findFirst')
        .mockReturnValue({ role: { name: 'member' } });
      await expect(
        service.projectName(projectId, userWithRoleMock),
      ).resolves.toEqual({
        projectName: 'projectName',
        isAdmin: false,
        isModerator: false,
        user: { username: userWithRoleMock.username },
      });
    });
    it('Should succes return project name (moderator)', async () => {
      jest
        .spyOn(messagePrismaMock.project, 'findUnique')
        .mockReturnValue({ name: 'projectName' });
      jest
        .spyOn(messagePrismaMock.user_Has_Project, 'findFirst')
        .mockReturnValue({ role: { name: roleProject.MODERATOR } });
      await expect(
        service.projectName(projectId, userWithRoleMock),
      ).resolves.toEqual({
        projectName: 'projectName',
        isAdmin: false,
        isModerator: true,
        user: { username: userWithRoleMock.username },
      });
    });
    it('Should succes return project name (admin)', async () => {
      jest
        .spyOn(messagePrismaMock.project, 'findUnique')
        .mockReturnValue({ name: 'projectName' });
      await expect(
        service.projectName(projectId, adminWithRoleMock),
      ).resolves.toEqual({
        projectName: 'projectName',
        isAdmin: true,
        isModerator: false,
        user: { username: adminWithRoleMock.username },
      });
      expect(
        messagePrismaMock.user_Has_Project.findFirst,
      ).not.toHaveBeenCalled();
    });
  });
  describe('Create Message', () => {
    const messageDTO = { message: 'text' };
    it('should return Message created !', async () => {
      jest
        .spyOn(messagePrismaMock.project, 'findUnique')
        .mockResolvedValue({ id: '1' });
      jest
        .spyOn(messagePrismaMock.message, 'create')
        .mockResolvedValue(undefined);
      jest.spyOn(notificationServiceMock, 'createMany').mockResolvedValue(null);
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
          isVisible: true,
          createdAt: true,
          updatedAt: true,
          projectId: true,
          message: true,
          user: {
            select: {
              id: true,
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
    const existingMessage = {
      id: messageId,
      projectId: projectId,
      authorId: 'otherUserId',
    };
    it('should return Message deleted with User account !', async () => {
      const newExistingMessage = { ...existingMessage };
      newExistingMessage.authorId = userWithRoleMock.id;
      jest
        .spyOn(messagePrismaMock.message, 'findUnique')
        .mockResolvedValue(newExistingMessage);
      jest
        .spyOn(messagePrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue({
          role: { name: roleProject.MEMBER },
          userId: userWithRoleMock.id,
        });
      await expect(
        service.deleteMessage(messageId, userWithRoleMock),
      ).resolves.toEqual({
        message: 'Message deleted !',
      });
      expect(messagePrismaMock.message.update).toHaveBeenCalledWith({
        where: {
          id: messageId,
        },
        data: { isArchive: true },
      });
      expect(messageGatewayMock.emitDeleteMessage).toHaveBeenCalledWith(
        existingMessage.id,
        existingMessage.projectId,
      );
    });
    it('should return Message deleted with Admin account !', async () => {
      jest
        .spyOn(messagePrismaMock.message, 'findUnique')
        .mockResolvedValue(existingMessage);
      await expect(
        service.deleteMessage(messageId, adminWithRoleMock),
      ).resolves.toEqual({
        message: 'Message deleted !',
      });
      expect(messagePrismaMock.message.update).toHaveBeenCalledWith({
        where: {
          id: messageId,
        },
        data: { isArchive: true },
      });
      expect(messageGatewayMock.emitDeleteMessage).toHaveBeenCalledWith(
        existingMessage.id,
        existingMessage.projectId,
      );
    });
    it('should return Message deleted with Moderator account !', async () => {
      jest
        .spyOn(messagePrismaMock.message, 'findUnique')
        .mockResolvedValue(existingMessage);
      jest
        .spyOn(messagePrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue({
          role: { name: roleProject.MODERATOR },
          userId: userWithRoleMock.id,
        });
      await expect(
        service.deleteMessage(messageId, userWithRoleMock),
      ).resolves.toEqual({
        message: 'Message deleted !',
      });
      expect(messagePrismaMock.message.update).toHaveBeenCalledWith({
        where: {
          id: messageId,
        },
        data: { isArchive: true },
      });
      expect(messageGatewayMock.emitDeleteMessage).toHaveBeenCalledWith(
        existingMessage.id,
        existingMessage.projectId,
      );
    });
    it('should return Not Found Exception', async () => {
      jest
        .spyOn(messagePrismaMock.message, 'findUnique')
        .mockResolvedValue(undefined);
      await expect(
        service.deleteMessage(messageId, userWithRoleMock),
      ).rejects.toEqual(new NotFoundException('Message not found !'));
      expect(messageGatewayMock.emitDeleteMessage).not.toHaveBeenCalled();
    });
    it('should return You are unauthorized ! User is not in the project', async () => {
      jest
        .spyOn(messagePrismaMock.message, 'findUnique')
        .mockResolvedValue(existingMessage);
      jest
        .spyOn(messagePrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue(null);
      await expect(
        service.deleteMessage(messageId, userWithRoleMock),
      ).rejects.toEqual(new ForbiddenException('You are unauthorized !'));
      expect(messageGatewayMock.emitDeleteMessage).not.toHaveBeenCalled();
    });
    it('should return You are unauthorized ! Member and is not her message', async () => {
      jest
        .spyOn(messagePrismaMock.message, 'findUnique')
        .mockResolvedValue(existingMessage);
      jest
        .spyOn(messagePrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue({
          role: { name: roleProject.MEMBER },
          userId: userWithRoleMock.id,
        });
      await expect(
        service.deleteMessage(messageId, userWithRoleMock),
      ).rejects.toEqual(new ForbiddenException('You are unauthorized !'));
      expect(messageGatewayMock.emitDeleteMessage).not.toHaveBeenCalled();
    });
  });
  describe('Delete All Message', () => {
    it('should return Messages deleted ! Moderator account', async () => {
      jest
        .spyOn(messagePrismaMock.project, 'findUnique')
        .mockResolvedValue({ id: projectId });
      jest
        .spyOn(messagePrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue({ id: 'userProjectId' });
      await expect(
        service.deleteAllMessage(projectId, userWithRoleMock),
      ).resolves.toEqual({
        message: 'Messages deleted !',
      });
      expect(messagePrismaMock.message.updateMany).toHaveBeenCalledWith({
        where: {
          projectId,
        },
        data: { isArchive: true },
      });
      expect(messageGatewayMock.emitResetMessage).toHaveBeenCalledWith(
        projectId,
      );
    });
    it('should return Messages deleted ! Admin account', async () => {
      jest
        .spyOn(messagePrismaMock.project, 'findUnique')
        .mockResolvedValue({ id: projectId });
      await expect(
        service.deleteAllMessage(projectId, adminWithRoleMock),
      ).resolves.toEqual({
        message: 'Messages deleted !',
      });
      expect(messagePrismaMock.message.updateMany).toHaveBeenCalledWith({
        where: {
          projectId,
        },
        data: { isArchive: true },
      });
      expect(messageGatewayMock.emitResetMessage).toHaveBeenCalledWith(
        projectId,
      );
    });
    it('should return Not Found Exception', async () => {
      jest
        .spyOn(messagePrismaMock.project, 'findUnique')
        .mockResolvedValue(null);
      await expect(
        service.deleteAllMessage(projectId, userWithRoleMock),
      ).rejects.toEqual(new NotFoundException('Project not found !'));
      expect(messagePrismaMock.message.updateMany).not.toHaveBeenCalled();
      expect(messageGatewayMock.emitResetMessage).not.toHaveBeenCalled();
    });
    it('should return Forbidden Exception, You are unauthorized !', async () => {
      jest
        .spyOn(messagePrismaMock.project, 'findUnique')
        .mockResolvedValue({ id: projectId });
      jest
        .spyOn(messagePrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue(null);
      await expect(
        service.deleteAllMessage(projectId, userWithRoleMock),
      ).rejects.toEqual(new ForbiddenException('You are unauthorized !'));
      expect(messagePrismaMock.message.updateMany).not.toHaveBeenCalled();
      expect(messageGatewayMock.emitResetMessage).not.toHaveBeenCalled();
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
      expect(socketMock.join).toHaveBeenCalledWith(`message/${projectId}`);
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
