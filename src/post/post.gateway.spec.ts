import { Test, TestingModule } from '@nestjs/testing';
import { PostGateway } from './post.gateway';
import { PostService } from './post.service';
import { postServiceMock } from './mock/post.service.mock';
import { Server, Socket } from 'socket.io';
import { socketMock } from 'src/message/mock/socket.mock';
import { serverMock } from 'src/message/mock/server.mock';
import { userMock } from 'src/auth/mock/auth.mock';
import { postType } from 'src/utils/type';

describe('PostGateway', () => {
  let gateway: PostGateway;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostGateway,
        { provide: PostService, useValue: postServiceMock },
        { provide: Socket, useValue: socketMock },
        { provide: Server, useValue: serverMock },
      ],
    }).compile();
    gateway = module.get<PostGateway>(PostGateway);
    gateway.server = serverMock;
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  const projectId = 'id';
  const postMock: postType = {
    text: 'text',
    id: 'postId',
    isArchive: false,
    isVisible: true,
    poseX: 0,
    poseY: 0,
    score: 0,
    user: { id: 'userId', username: 'username' },
    vote: [{ isUp: false }],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const postRoom = `post/${projectId}`;
  it('Should be defined', () => {
    expect(gateway).toBeDefined();
  });
  describe('join Room Post', () => {
    it('Should join room post', () => {
      jest.spyOn(postServiceMock, 'joinRoomPost');
      expect(gateway.joinRoomPost(socketMock, projectId, userMock));
    });
  });
  describe('emit New Post', () => {
    it('Should Emit New Post', () => {
      expect(gateway.emitNewPost(postMock, projectId, 'sectionId'));
      expect(serverMock.to).toHaveBeenCalledWith(postRoom);
      expect(serverMock.emit).toHaveBeenCalledWith('post', {
        action: 'create',
        post: postMock,
        sectionId: 'sectionId',
      });
    });
  });
  describe('emit Update Post', () => {
    it('Should emit Update Post', () => {
      expect(gateway.emitUpdatePost(postMock, projectId));
      expect(serverMock.to).toHaveBeenCalledWith(postRoom);
      expect(serverMock.emit).toHaveBeenCalledWith('post', {
        action: 'update',
        post: postMock,
      });
    });
  });
  describe('emit Delete Post', () => {
    it('Should Emit Post Deleted', () => {
      expect(gateway.emitDeletePost(postMock.id, projectId));
      expect(serverMock.to).toHaveBeenCalledWith(postRoom);
      expect(serverMock.emit).toHaveBeenCalledWith('post', {
        action: 'delete',
        post: { id: postMock.id },
      });
    });
  });
  describe('emit Transfert Post', () => {
    it('Should Emit Post Transfered', () => {
      expect(gateway.emitTransfertPost(postMock, projectId, 'sectionId'));
      expect(serverMock.to).toHaveBeenCalledWith(postRoom);
      expect(serverMock.emit).toHaveBeenCalledWith('post', {
        action: 'transfert',
        post: postMock,
        sectionId: 'sectionId',
      });
    });
  });
  describe('emit Vote Post', () => {
    it('Should Emit Post Voted', () => {
      const scoreMock = 0;
      expect(gateway.emitVotePost(postMock.id, scoreMock, projectId));
      expect(serverMock.to).toHaveBeenCalledWith(postRoom);
      expect(serverMock.emit).toHaveBeenCalledWith('post', {
        action: 'vote',
        post: { id: postMock.id, score: scoreMock },
      });
    });
  });
  describe('emit Reset Post', () => {
    it('Should emit Post Reseted', () => {
      expect(gateway.emitResetPost(projectId, 'sectionId'));
      expect(serverMock.to).toHaveBeenCalledWith(postRoom);
      expect(serverMock.emit).toHaveBeenCalledWith('post', {
        action: 'reset',
        sectionId: 'sectionId',
      });
    });
  });
  describe('emit Update Many Post (ban or unBan post)', () => {
    it('Should emit postsUpdate', () => {
      gateway.emitUpdateManyPost('userId', 'id', true);
      expect(serverMock.to).toHaveBeenCalledWith(postRoom);
      expect(serverMock.emit).toHaveBeenCalledWith('post', {
        action: 'postsUpdate',
        userId: 'userId',
        isBan: true,
      });
    });
  });
  describe('emit Kick User ', () => {
    it('Should emit kickUser', () => {
      gateway.emitKickUser('userId', 'id');
      expect(serverMock.to).toHaveBeenCalledWith(postRoom);
      expect(serverMock.emit).toHaveBeenCalledWith('post', {
        action: 'kickUser',
        userId: 'userId',
      });
    });
  });
  describe('Emit Transfert All Post', () => {
    it('Should emit transfertPosts', () => {
      gateway.emitTransfertAllPost(projectId, [postMock], 'sectionId');
      expect(serverMock.to).toHaveBeenCalledWith(postRoom);
      expect(serverMock.emit).toHaveBeenCalledWith('post', {
        action: 'transfertPosts',
        posts: [postMock],
        sectionId: 'sectionId',
      });
    });
  });
});
