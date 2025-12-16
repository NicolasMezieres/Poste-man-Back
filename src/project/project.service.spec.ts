import { Test, TestingModule } from '@nestjs/testing';
import { ProjectService } from './project.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { projectPrismaMock } from './mock/project.prisma.mock';
import {
  adminWithRoleMock,
  userMock,
  userWithRoleMock,
} from 'src/auth/mock/auth.mock';
import {
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ProjectGateway } from './project.gateway';
import { projectGatewayMock } from './mock/project.gateway.mock';
import { roleProject } from 'src/utils/enum';
describe('ProjectService', () => {
  let service: ProjectService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        { provide: PrismaService, useValue: projectPrismaMock },
        { provide: ProjectGateway, useValue: projectGatewayMock },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('Search', () => {
    it('should be return list project, total project, status end list', async () => {
      const query = { page: 1, search: '' };
      const countProject = 1;
      const listProject = [projectPrismaMock];
      jest
        .spyOn(projectPrismaMock.project, 'count')
        .mockResolvedValue(countProject);
      jest
        .spyOn(projectPrismaMock.project, 'findMany')
        .mockResolvedValue(listProject);
      await expect(service.search(query, userMock)).resolves.toEqual({
        data: listProject,
        total: countProject,
        isEndList: true,
      });
    });
  });
  describe('Search admin', () => {
    it('should be return list project, total project, status end list', async () => {
      const query = {
        page: 1,
        search: '',
        fromDate: '2025/09/06',
        toDate: '2025/09/06',
      };
      const countProject = 1;
      jest
        .spyOn(projectPrismaMock.project, 'count')
        .mockResolvedValue(countProject);
      jest.spyOn(projectPrismaMock.project, 'findMany').mockResolvedValue([]);
      await expect(service.searchByAdmin(query)).resolves.toEqual({
        data: [],
        total: countProject,
        isEndList: true,
      });
    });
  });
  const projectId = '1';
  describe('Get Project', () => {
    it('Should fail not found project', async () => {
      jest
        .spyOn(projectPrismaMock.project, 'findUnique')
        .mockResolvedValue(undefined);
      await expect(
        service.getProject(projectId, userWithRoleMock),
      ).rejects.toEqual(new NotFoundException('Projet introuvable !'));
    });
    it('Should fail is not an admin or a member', async () => {
      jest
        .spyOn(projectPrismaMock.project, 'findUnique')
        .mockResolvedValue({ id: 'id', name: 'name' });
      jest
        .spyOn(projectPrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue(undefined);
      await expect(
        service.getProject(projectId, userWithRoleMock),
      ).rejects.toEqual(
        new ForbiddenException('Vous ne faites pas partie de ce projet !'),
      );
    });
    it('Should return name of project, isModerator, isAdmin', async () => {
      jest
        .spyOn(projectPrismaMock.project, 'findUnique')
        .mockResolvedValue({ id: 'id', name: 'name' });
      jest
        .spyOn(projectPrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue({ role: { name: 'member' } });
      await expect(
        service.getProject(projectId, userWithRoleMock),
      ).resolves.toEqual({
        isModerator: false,
        isAdmin: false,
        projectName: 'name',
      });
    });
  });
  describe('Create', () => {
    const dto = { name: 'project' };

    it('Should return a message', async () => {
      const roleProjectId = '1';

      jest
        .spyOn(projectPrismaMock.role_Project, 'findUnique')
        .mockResolvedValue(roleProjectId);
      jest
        .spyOn(projectPrismaMock.project, 'create')
        .mockResolvedValue(projectId);
      jest
        .spyOn(projectPrismaMock.user_Has_Project, 'create')
        .mockResolvedValue(null);
      await expect(service.create(dto, userMock)).resolves.toEqual({
        message: 'Project successfully create !',
      });
    });
    it('should return an Internal Server Error Exception', async () => {
      jest
        .spyOn(projectPrismaMock.role_Project, 'findUnique')
        .mockResolvedValue(null);
      await expect(service.create(dto, userMock)).rejects.toEqual(
        new InternalServerErrorException('Role project not found'),
      );
    });
  });
  describe('Create invitation link', () => {
    it('should be return a Message and an Invitation Link', async () => {
      const projectLink = { id: '1', outdated: '2025-09-06' };
      jest
        .spyOn(projectPrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue({ project: { id: '1' } });
      jest
        .spyOn(projectPrismaMock.link_Project, 'create')
        .mockResolvedValue(projectLink);
      await expect(
        service.createInvitationLink(projectId, userMock),
      ).resolves.toEqual({ message: 'Link created !', data: projectLink });
    });
    it('should be return a Not Found Exception', async () => {
      jest
        .spyOn(projectPrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue(null);

      await expect(
        service.createInvitationLink(projectId, userMock),
      ).rejects.toEqual(new NotFoundException('Project not found !'));
    });
  });
  describe('Join project', () => {
    const linkId = '1';
    const linkProject = {
      numberUsage: 10,
      outdatedAt: new Date(new Date().setDate(new Date().getDate() + 1)),
      projet: { name: 'project', id: '1', users: [{ userId: '2' }] },
    };
    it('should be return a message', async () => {
      jest
        .spyOn(projectPrismaMock.link_Project, 'findUnique')
        .mockResolvedValue(linkProject);
      jest
        .spyOn(projectPrismaMock.role_Project, 'findUnique')
        .mockResolvedValue({ id: '1' });
      jest
        .spyOn(projectPrismaMock, '$transaction')
        .mockResolvedValue([userMock]);

      jest
        .spyOn(projectPrismaMock.user_Has_Project, 'create')
        .mockResolvedValue(null);
      jest
        .spyOn(projectPrismaMock.link_Project, 'update')
        .mockResolvedValue(null);

      await expect(service.joinProject(linkId, userMock)).resolves.toEqual({
        message: `Welcome to ${linkProject.projet.name} !`,
      });
      expect(projectGatewayMock.emitUserUpdateProject).toHaveBeenCalledWith(
        userMock,
        projectId,
        true,
      );
    });
    it('should be return Not found Exception link invalid when link not found', async () => {
      jest
        .spyOn(projectPrismaMock.link_Project, 'findUnique')
        .mockResolvedValue(null);
      await expect(service.joinProject(linkId, userMock)).rejects.toEqual(
        new NotFoundException('Link invalid !'),
      );
    });
    it('should be return Not found Exception link invalid when link number usage less than or equal 0', async () => {
      const newLinkProject = { ...linkProject, numberUsage: 0 };
      jest
        .spyOn(projectPrismaMock.link_Project, 'findUnique')
        .mockResolvedValue(newLinkProject);
      await expect(service.joinProject(linkId, userMock)).rejects.toEqual(
        new NotFoundException('Link invalid !'),
      );
    });
    it('should be return Forbidden Exception link expired', async () => {
      const newLinkProject = {
        ...linkProject,
        outdatedAt: new Date(new Date().setDate(new Date().getDate() - 1)),
      };

      jest
        .spyOn(projectPrismaMock.link_Project, 'findUnique')
        .mockResolvedValue(newLinkProject);
      await expect(service.joinProject(linkId, userMock)).rejects.toEqual(
        new ForbiddenException('Link expired !'),
      );
    });
    it('should be return Forbidden Exception already in the project', async () => {
      const newLinkProject = { ...linkProject };
      newLinkProject.projet.users[0].userId = '1';
      jest
        .spyOn(projectPrismaMock.link_Project, 'findUnique')
        .mockResolvedValue(newLinkProject);
      await expect(service.joinProject(linkId, userMock)).rejects.toEqual(
        new ForbiddenException('You are already in the project !'),
      );
    });
    it('should be return Internal Server Error Exception Role not found !', async () => {
      linkProject.projet.users[0].userId = '2';
      jest
        .spyOn(projectPrismaMock.link_Project, 'findUnique')
        .mockResolvedValue(linkProject);
      jest
        .spyOn(projectPrismaMock.role_Project, 'findUnique')
        .mockResolvedValue(null);
      await expect(service.joinProject(linkId, userMock)).rejects.toEqual(
        new InternalServerErrorException('Role not found !'),
      );
    });
    it('should be return Internal Server Error Exception failed to create user project member', async () => {
      jest
        .spyOn(projectPrismaMock.link_Project, 'findUnique')
        .mockResolvedValue(linkProject);
      jest
        .spyOn(projectPrismaMock.role_Project, 'findUnique')
        .mockResolvedValue({ id: '1' });
      jest.spyOn(projectPrismaMock, '$transaction').mockResolvedValue([]);

      jest
        .spyOn(projectPrismaMock.user_Has_Project, 'create')
        .mockResolvedValue(null);
      jest
        .spyOn(projectPrismaMock.link_Project, 'update')
        .mockResolvedValue(null);

      await expect(service.joinProject(linkId, userMock)).rejects.toEqual(
        new InternalServerErrorException(
          'Failed to create user project member',
        ),
      );
    });
  });
  describe('Ban', () => {
    const userId = '1';
    it('should be return a message', async () => {
      jest
        .spyOn(projectPrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValueOnce({ id: '1', isBanned: false })
        .mockResolvedValueOnce({ id: '2', isBanned: false });
      jest
        .spyOn(projectPrismaMock.user_Has_Project, 'update')
        .mockResolvedValue(null);
      await expect(service.ban(projectId, userId, userMock)).resolves.toEqual({
        message: 'Ban status updated',
      });
    });
    it('should be return a Forbidden Exception', async () => {
      jest
        .spyOn(projectPrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue(null);
      await expect(service.ban(projectId, userId, userMock)).rejects.toEqual(
        new ForbiddenException('You are unauthorized 😡 !'),
      );
    });
    it('should be return a Not Found Exception', async () => {
      jest
        .spyOn(projectPrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValueOnce({ id: '1', isBanned: false })
        .mockResolvedValueOnce(null);
      await expect(service.ban(projectId, userId, userMock)).rejects.toEqual(
        new NotFoundException('Not found member !'),
      );
    });
  });
  describe('Rename', () => {
    const dto = { name: 'project' };
    it('should be return a message', async () => {
      jest
        .spyOn(projectPrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue(projectId);
      jest.spyOn(projectPrismaMock.project, 'update').mockResolvedValue(null);
      await expect(service.rename(dto, projectId, userMock)).resolves.toEqual({
        message: 'Project modified !',
      });
    });
    it('should be return a message', async () => {
      jest
        .spyOn(projectPrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue(null);
      await expect(service.rename(dto, projectId, userMock)).rejects.toEqual(
        new NotFoundException('Project not found !'),
      );
    });
  });
  describe('Remove', () => {
    const project = {
      id: '1',
      projectId: '1',
      role: {
        name: 'Moderator',
      },
    };
    it('should be return a message, project deleted ! Moderator', async () => {
      jest
        .spyOn(projectPrismaMock.project, 'findUnique')
        .mockResolvedValue(project);
      jest
        .spyOn(projectPrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue({
          id: 'userProjectId',
          role: { name: roleProject.MODERATOR },
        });
      jest.spyOn(projectPrismaMock, '$transaction');
      await expect(
        service.remove(project.projectId, userWithRoleMock),
      ).resolves.toEqual({ message: 'Project deleted !' });
    });
    it('should be return a message, project deleted ! Admin', async () => {
      jest
        .spyOn(projectPrismaMock.project, 'findUnique')
        .mockResolvedValue(project);
      jest
        .spyOn(projectPrismaMock, '$transaction')
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
        .mockImplementation((cb) => cb(projectPrismaMock));
      await expect(
        service.remove(project.projectId, adminWithRoleMock),
      ).resolves.toEqual({ message: 'Project deleted !' });
    });
    it('should be return a message, member project leaved !', async () => {
      jest
        .spyOn(projectPrismaMock.project, 'findUnique')
        .mockResolvedValue({ id: projectId });
      jest
        .spyOn(projectPrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue({
          id: 'userProjectId',
          role: { name: roleProject.MEMBER },
        });
      jest
        .spyOn(projectPrismaMock.user_Has_Project, 'delete')
        .mockResolvedValue(null);
      await expect(
        service.remove(project.projectId, userWithRoleMock),
      ).resolves.toEqual({ message: 'Project leaved !' });
    });
    it('should be return a Not Found Exception', async () => {
      jest
        .spyOn(projectPrismaMock.project, 'findUnique')
        .mockResolvedValue(null);
      await expect(
        service.remove(project.projectId, userWithRoleMock),
      ).rejects.toEqual(new NotFoundException('Project not found !'));
    });
    it('should be return a Unauthorized Excetption Exception, user is not an Admin and not a member', async () => {
      jest
        .spyOn(projectPrismaMock.project, 'findUnique')
        .mockResolvedValue({ id: projectId });
      jest
        .spyOn(projectPrismaMock.user_Has_Project, 'findFirst')
        .mockResolvedValue(null);
      await expect(
        service.remove(project.projectId, userWithRoleMock),
      ).rejects.toEqual(new UnauthorizedException('You are unauthorized !'));
    });
  });
  describe('list Member', () => {
    const userId = userWithRoleMock.id;
    it('should return list member, member', async () => {
      jest
        .spyOn(projectPrismaMock.project, 'findUnique')
        .mockResolvedValue(projectId);
      jest
        .spyOn(projectPrismaMock.user_Has_Project, 'findMany')
        .mockResolvedValue([
          {
            userId,
            user: { username: 'user', icon: { image: null } },
            isBanned: false,
          },
        ]);
      await expect(
        service.listMember(projectId, userWithRoleMock),
      ).resolves.toEqual({
        data: [
          {
            userId,
            isBanned: false,
            user: { username: 'user', icon: { image: null } },
          },
        ],
        projectId,
      });
    });
    it('should fail Not Found Exception, Project not found !', async () => {
      jest
        .spyOn(projectPrismaMock.project, 'findUnique')
        .mockResolvedValue(null);
      await expect(
        service.listMember(projectId, userWithRoleMock),
      ).rejects.toEqual(new NotFoundException('Project not found !'));
    });
    it('should fail Forbidden Exception, You are unauthorized ! Not a member and Not an admin', async () => {
      jest
        .spyOn(projectPrismaMock.project, 'findUnique')
        .mockResolvedValue({ id: projectId });
      jest
        .spyOn(projectPrismaMock.user_Has_Project, 'findMany')
        .mockResolvedValue([]);
      await expect(
        service.listMember(projectId, userWithRoleMock),
      ).rejects.toEqual(new UnauthorizedException('You are unauthorized !'));
    });
  });
  describe('kick User', () => {
    const userId = 'userId';
    it('should return a message', async () => {
      jest.spyOn(projectPrismaMock.project, 'findFirst').mockResolvedValue({
        users: [
          {
            id: 'id',
            userId: userId,
            isBanned: false,
            user: { username: 'user', icon: { image: null } },
          },
        ],
      });
      jest
        .spyOn(projectPrismaMock.user_Has_Project, 'delete')
        .mockResolvedValue(null);
      await expect(
        service.kickUser(projectId, userId, userMock),
      ).resolves.toEqual({ message: 'User kick' });
      expect(projectPrismaMock.user_Has_Project.delete).toHaveBeenCalledWith({
        where: { id: 'id' },
      });
      expect(projectGatewayMock.emitUserUpdateProject).toHaveBeenCalledWith(
        {
          id: 'id',
          userId: userId,
          isBanned: false,
          user: { username: 'user', icon: { image: null } },
        },
        projectId,
        false,
      );
    });
    it('should return a forbidden Exception', async () => {
      jest
        .spyOn(projectPrismaMock.project, 'findFirst')
        .mockResolvedValue(null);

      await expect(
        service.kickUser(projectId, userId, userMock),
      ).rejects.toEqual(new ForbiddenException('User not found'));
    });
  });
});
