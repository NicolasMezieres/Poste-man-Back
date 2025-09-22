import { Test, TestingModule } from '@nestjs/testing';
import { MessageGateway } from './message.gateway';
import { Socket, Server } from 'socket.io';
import { socketMock } from './mock/socket.mock';
import { message } from 'src/utils/type';
import { serverMock } from './mock/server.mock';
import { MessageService } from './message.service';
import { messageServiceMock } from './mock/message.service.mock';
import { userMock } from 'src/auth/mock/auth.mock';
describe('MessageGateway', () => {
  let gateway: MessageGateway;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageGateway,
        { provide: MessageService, useValue: messageServiceMock },
        { provide: Socket, useValue: socketMock },
        { provide: Server, useValue: serverMock },
      ],
    }).compile();
    gateway = module.get<MessageGateway>(MessageGateway);
    gateway.server = serverMock;
  });
  const projectId = '1';
  const newMessage: message = {
    id: '1',
    createdAt: new Date(),
    updatedAt: new Date(),
    projectId: '1',
    message: 'texte',
    user: {
      username: 'username',
    },
  };
  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
  describe('Join Room Message', () => {
    it('should join rooom', () => {
      jest.spyOn(messageServiceMock, 'joinRoomMessage').mockResolvedValue(null);
      expect(gateway.joinRoomMessage(socketMock, projectId, userMock));
    });
  });
  describe('Emit New Message', () => {
    it('Should Emit New Message', () => {
      expect(gateway.emitNewMessage(newMessage, projectId));
      expect(serverMock.to).toHaveBeenCalledWith(projectId);
      expect(serverMock.emit).toHaveBeenCalledWith('message', {
        action: 'create',
        message: newMessage,
      });
    });
  });
  describe('Emit Delete Message', () => {
    it('Should Emit Delete Message', () => {
      expect(gateway.emitDeleteMessage(newMessage.id, projectId));
      expect(serverMock.to).toHaveBeenCalledWith(projectId);
      expect(serverMock.emit).toHaveBeenCalledWith('message', {
        action: 'delete',
        message: { id: newMessage.id },
      });
    });
  });
  describe('Emit Reset Message', () => {
    it('Should Emit Reset Message', () => {
      expect(gateway.emitResetMessage(projectId));
      expect(serverMock.to).toHaveBeenCalledWith(projectId);
      expect(serverMock.emit).toHaveBeenCalledWith('message', {
        action: 'reset',
      });
    });
  });
});
