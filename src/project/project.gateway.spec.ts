import { Test, TestingModule } from '@nestjs/testing';
import { Socket, Server } from 'socket.io';
import { userMock, userWithRoleMock } from 'src/auth/mock/auth.mock';
import { ProjectGateway } from './project.gateway';
import { ProjectService } from './project.service';
import { socketMock } from 'src/message/mock/socket.mock';
import { serverMock } from 'src/message/mock/server.mock';
import { projectServiceMock } from './mock/project.service.mock';
import { dataMemberMock } from './mock/project.mock';
import { WsException } from '@nestjs/websockets';
describe('ProjectGateway', () => {
  let gateway: ProjectGateway;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectGateway,
        { provide: ProjectService, useValue: projectServiceMock },
        { provide: Socket, useValue: socketMock },
        { provide: Server, useValue: serverMock },
      ],
    }).compile();
    gateway = module.get<ProjectGateway>(ProjectGateway);
    gateway.server = serverMock;
  });
  const projectId = '1';
  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
  describe('handle disconnect', () => {
    it('should disconnect and emit ', () => {
      gateway['userConnected'] = [
        { clientId: socketMock.id, userId: userMock.id, projectMemberIds: [] },
      ];
      const emitUserSpyon = jest.spyOn(gateway, 'emitUserStatus');
      expect(gateway.handleDisconnect(socketMock));
      expect(emitUserSpyon).toHaveBeenCalled();
    });
    it('should not found user', () => {
      gateway['userConnected'] = [];
      const emitUserSpyon = jest.spyOn(gateway, 'emitUserStatus');
      expect(gateway.handleDisconnect(socketMock));
      expect(emitUserSpyon).not.toHaveBeenCalled();
    });
    it('should not emit if another session user is already connected', () => {
      gateway['userConnected'] = [
        { clientId: socketMock.id, userId: userMock.id, projectMemberIds: [] },
        { clientId: '2', userId: userMock.id, projectMemberIds: [] },
      ];
      const emitUserSpyon = jest.spyOn(gateway, 'emitUserStatus');
      expect(gateway.handleDisconnect(socketMock));
      expect(emitUserSpyon).not.toHaveBeenCalled();
    });
  });
  describe('new Connected User', () => {
    it('Should Emit User connected', () => {
      gateway['userConnected'] = [];
      expect(gateway.newConnectedUser(userMock, socketMock));
      expect(gateway.emitUserStatus(userMock.id, true));
      expect(gateway['userConnected']).toEqual([
        {
          userId: userMock.id,
          clientId: socketMock.id,
          projectMemberIds: [],
        },
      ]);
    });
    it('Should not emit', () => {
      gateway['userConnected'] = [
        {
          userId: userMock.id,
          clientId: socketMock.id,
          projectMemberIds: [],
        },
      ];
      const emitUserStatusSpy = jest.spyOn(gateway, 'emitUserStatus');
      expect(gateway.newConnectedUser(userMock, socketMock));
      expect(emitUserStatusSpy).not.toHaveBeenCalled();
    });
  });
  describe('Emit User Status', () => {
    it('should Emit User online', () => {
      gateway['userConnected'] = [
        {
          userId: userMock.id,
          clientId: 'clientId',
          projectMemberIds: [userMock.id],
          projectId: projectId,
        },
      ];
      const status = 'online';
      expect(gateway.emitUserStatus(userMock.id, true));
      expect(serverMock.to('clientId').emit).toHaveBeenCalledWith(status, {
        userId: userMock.id,
      });
    });
  });
  describe('list Member Connected', () => {
    it('Should return list member connected', async () => {
      gateway['userConnected'] = [
        {
          userId: userMock.id,
          clientId: socketMock.id,
          projectMemberIds: [],
          projectId: projectId,
        },
        {
          userId: 'userId',
          clientId: 'clientId',
          projectMemberIds: [],
        },
      ];
      jest
        .spyOn(projectServiceMock, 'listMember')
        .mockResolvedValue(dataMemberMock);
      await expect(
        gateway.listMemberConnected(userWithRoleMock, socketMock, projectId),
      ).resolves.toEqual(dataMemberMock.data);
    });

    it('Should return list member', async () => {
      gateway['userConnected'] = [
        {
          userId: userMock.id,
          clientId: socketMock.id,
          projectMemberIds: [],
          projectId: projectId,
        },
      ];
      const members = dataMemberMock;
      members.data[0].isConnected = false;
      jest.spyOn(projectServiceMock, 'listMember').mockResolvedValue(members);

      await expect(
        gateway.listMemberConnected(userWithRoleMock, socketMock, projectId),
      ).resolves.toEqual(members.data);
    });
    it('Should return Websocket Exception', async () => {
      gateway['userConnected'] = [];

      await expect(
        gateway.listMemberConnected(userWithRoleMock, socketMock, projectId),
      ).rejects.toEqual(new WsException('User not connected'));
    });
  });
  describe('emit User Update Project', () => {
    it('Should emit user join project', () => {
      const data = {
        user: { username: 'username', icon: { image: 'image' } },
        userId: '2',
        isBanned: false,
      };
      gateway['userConnected'] = [
        {
          userId: userMock.id,
          clientId: socketMock.id,
          projectMemberIds: [],
          projectId: projectId,
        },
      ];
      expect(gateway.emitUserUpdateProject(data, projectId, true));
      expect(gateway.server.to(socketMock.id).emit).toHaveBeenCalledWith(
        'userJoinProject',
        {
          ...data,
          isConnected: false,
        },
      );
    });
    it('Should emit user leave project', () => {
      const data = {
        user: { username: 'username', icon: { image: 'image' } },
        userId: '2',
        isBanned: false,
      };
      gateway['userConnected'] = [
        {
          userId: userMock.id,
          clientId: socketMock.id,
          projectMemberIds: ['2'],
          projectId: projectId,
        },
      ];
      expect(gateway.emitUserUpdateProject(data, projectId, false));
      expect(gateway.server.to(socketMock.id).emit).toHaveBeenCalledWith(
        'userLeaveProject',
        {
          userId: '2',
        },
      );
    });
    it('Should disconnect user socket', () => {
      const data = {
        user: { username: 'username', icon: { image: 'image' } },
        userId: userMock.id,
        isBanned: false,
      };
      gateway['userConnected'] = [
        {
          userId: userMock.id,
          clientId: socketMock.id,
          projectMemberIds: [userMock.id],
          projectId: projectId,
        },
      ];
      expect(gateway.emitUserUpdateProject(data, projectId, false));
      expect(
        gateway.server.to(socketMock.id).disconnectSockets,
      ).toHaveBeenCalled();
    });
  });
});
