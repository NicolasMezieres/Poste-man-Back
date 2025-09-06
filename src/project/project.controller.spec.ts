import { Test, TestingModule } from '@nestjs/testing';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';
import { projectServiceMock } from './mock/project.service.mock';
import {
  createLinkProjectMock,
  messageProjectMock,
  searchAdminMock,
  searchMock,
} from './mock/project.mock';
import { userMock } from 'src/auth/mock/auth.mock';

describe('ProjectController', () => {
  let controller: ProjectController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [{ provide: ProjectService, useValue: projectServiceMock }],
    }).compile();

    controller = module.get<ProjectController>(ProjectController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  describe('Search', () => {
    it('should return list project, count project and status end list', async () => {
      const queryMock = { page: 1, search: '' };
      await expect(controller.search(queryMock, userMock)).resolves.toEqual(
        searchMock,
      );
    });
  });
  describe('Search admin', () => {
    it('should return list project, count project and status end list', async () => {
      const queryMock = { page: 1, search: '', fromDate: '', toDate: '' };
      await expect(controller.searchByAdmin(queryMock)).resolves.toEqual(
        searchAdminMock,
      );
    });
  });
  describe('Create', () => {
    it('should return message', async () => {
      const dto = { name: 'project' };
      await expect(controller.create(dto, userMock)).resolves.toEqual(
        messageProjectMock,
      );
    });
  });
  describe('Create invitation link', () => {
    it('should return message and an invitation link', async () => {
      const projectId = 'id';
      await expect(
        controller.createInvitationLink(projectId, userMock),
      ).resolves.toEqual({ messageProjectMock, createLinkProjectMock });
    });
  });
  describe('Join project', () => {
    it('should return message', async () => {
      const linkId = 'id';
      await expect(controller.joinProject(linkId, userMock)).resolves.toEqual(
        messageProjectMock,
      );
    });
  });
  describe('ban', () => {
    it('should return message', async () => {
      const projectId = 'id';
      const userId = 'id';
      await expect(
        controller.ban(projectId, userId, userMock),
      ).resolves.toEqual(messageProjectMock);
    });
  });
  describe('rename', () => {
    it('should return message', async () => {
      const dto = { name: 'project' };
      const projectId = 'id';
      await expect(
        controller.rename(projectId, dto, userMock),
      ).resolves.toEqual(messageProjectMock);
    });
  });
  describe('remove', () => {
    it('should return message', async () => {
      const projectId = 'id';
      await expect(controller.remove(projectId, userMock)).resolves.toEqual(
        messageProjectMock,
      );
    });
  });
  describe('removeByAdmin', () => {
    it('should return message', async () => {
      const projectId = 'id';
      await expect(controller.removeByAdmin(projectId)).resolves.toEqual(
        messageProjectMock,
      );
    });
  });
});
