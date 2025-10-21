import { Test, TestingModule } from '@nestjs/testing';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { messageServiceMock } from './mock/message.service.mock';
import { userMock, userWithRoleMock } from 'src/auth/mock/auth.mock';
import { messageMock } from './mock/message.mock';

describe('MessageController', () => {
  let controller: MessageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessageController],
      providers: [{ provide: MessageService, useValue: messageServiceMock }],
    }).compile();

    controller = module.get<MessageController>(MessageController);
  });
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  const projectId = '1';
  const messageDTO = { message: 'text' };
  describe('Project Messages', () => {
    it('should return list messages', async () => {
      await expect(
        controller.projectMessages(projectId, userMock),
      ).resolves.toEqual({ data: [messageMock] });
    });
  });
  describe('Project Messages Admin', () => {
    it('should return list messages', async () => {
      await expect(controller.projectMessagesAdmin(projectId)).resolves.toEqual(
        { data: [messageMock] },
      );
    });
  });
  describe('Create Message', () => {
    it('should return Message created', async () => {
      await expect(
        controller.createMessage(projectId, messageDTO, userMock),
      ).resolves.toEqual({
        message: 'Message created !',
      });
    });
  });
  describe('Delete Message', () => {
    const messageId = '1';
    it('should return Message deleted !', async () => {
      await expect(
        controller.deleteMessage(messageId, userWithRoleMock),
      ).resolves.toEqual({
        message: 'Message deleted !',
      });
    });
  });
  describe('Delete All Message', () => {
    it('should return Messages deleted !', async () => {
      await expect(
        controller.deleteAllMessage(projectId, userWithRoleMock),
      ).resolves.toEqual({
        message: 'Messages deleted !',
      });
    });
  });
});
