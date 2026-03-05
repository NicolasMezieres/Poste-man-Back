import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  mockCreateDTO,
  mockUpdateDTO,
  roleProject,
  sectionDataMock,
} from './mock/section.mock';
import { sectionPrismaMock } from './mock/section.prisma.mock';
import { mockUser } from './mock/user.mock';
import { SectionService } from './section.service';
import { adminWithRoleMock, userWithRoleMock } from 'src/auth/mock/auth.mock';
import { mockUserUpdate } from 'src/user/mock/user.mock';

describe('SectionService', () => {
  let service: SectionService;
  let prisma: typeof sectionPrismaMock;

  beforeEach(async () => {
    prisma = { ...sectionPrismaMock };

    const module: TestingModule = await Test.createTestingModule({
      providers: [SectionService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<SectionService>(SectionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Get sections of project', () => {
    it('Should return a section list with an user account ', async () => {
      jest
        .spyOn(prisma.project, 'findUnique')
        .mockResolvedValue({ section: sectionDataMock, id: 'projectId' });
      jest
        .spyOn(prisma.user_Has_Project, 'findFirst')
        .mockResolvedValue({ role: { name: 'user' } });
      await expect(
        service.sections('projectId', userWithRoleMock),
      ).resolves.toEqual({
        data: sectionDataMock,
        isAdmin: false,
        isModerator: false,
      });
    });
    it('Should return a section list with an moderator account ', async () => {
      jest
        .spyOn(prisma.project, 'findUnique')
        .mockResolvedValue({ section: sectionDataMock, id: 'projectId' });
      jest
        .spyOn(prisma.user_Has_Project, 'findFirst')
        .mockResolvedValue({ role: { name: roleProject.MODERATOR } });
      await expect(
        service.sections('projectId', userWithRoleMock),
      ).resolves.toEqual({
        data: sectionDataMock,
        isAdmin: false,
        isModerator: true,
      });
    });
    it('Should return a section list with an account admin', async () => {
      jest
        .spyOn(prisma.project, 'findUnique')
        .mockResolvedValue({ section: sectionDataMock, id: 'projectId' });
      jest.spyOn(prisma.user_Has_Project, 'findFirst').mockResolvedValue(null);
      await expect(
        service.sections('projectId', adminWithRoleMock),
      ).resolves.toEqual({
        data: sectionDataMock,
        isModerator: false,
        isAdmin: true,
      });
    });
    it('Should return a Not Found Exception', async () => {
      jest.spyOn(prisma.project, 'findUnique').mockResolvedValue(null);
      await expect(
        service.sections('projectId', userWithRoleMock),
      ).rejects.toEqual(new NotFoundException('Projet introuvable !'));
    });
    it('Should return a Forbidden Exception', async () => {
      jest
        .spyOn(prisma.project, 'findUnique')
        .mockResolvedValue({ section: sectionDataMock, id: 'projectId' });
      jest.spyOn(prisma.user_Has_Project, 'findFirst').mockResolvedValue(null);
      await expect(
        service.sections('projectId', userWithRoleMock),
      ).rejects.toEqual(new ForbiddenException("Vous n'êtes pas autorisé"));
    });
  });
  describe('createSection', () => {
    it('should create a section successfully', async () => {
      const sectionMock = {
        id: 'id',
        name: 'name',
        isArchive: false,
        projectId: 'id',
      };
      prisma.user_Has_Project.findFirst.mockResolvedValue({ id: 'up-1' });
      prisma.section.findFirst.mockResolvedValue(null);
      prisma.section.create.mockResolvedValue(sectionMock);

      const result = await service.createSection(
        mockCreateDTO,
        'project-1',
        mockUserUpdate,
      );

      expect(prisma.user_Has_Project.findFirst).toHaveBeenCalledWith({
        where: {
          projectId: 'project-1',
          userId: mockUser.id,
          role: { name: roleProject.MODERATOR },
        },
        select: { id: true },
      });

      expect(prisma.section.findFirst).toHaveBeenCalledWith({
        where: {
          name: mockCreateDTO.name,
          project: { id: 'project-1' },
          isArchive: false,
        },
        select: { id: true },
      });

      expect(prisma.section.create).toHaveBeenCalledWith({
        data: { name: mockCreateDTO.name, projectId: 'project-1' },
      });

      expect(result).toEqual({ message: 'Section créé', data: sectionMock });
    });

    it('should throw ForbiddenException if user project not found', async () => {
      prisma.user_Has_Project.findFirst.mockResolvedValue(null);

      await expect(
        service.createSection(mockCreateDTO, 'project-1', mockUserUpdate),
      ).rejects.toThrow(
        new NotFoundException({ message: 'Projet introuvable' }),
      );
    });

    it('should throw BadRequestException if section name exists', async () => {
      prisma.user_Has_Project.findFirst.mockResolvedValue({ id: 'up-1' });
      prisma.section.findFirst.mockResolvedValue({ id: 'section-1' });

      await expect(
        service.createSection(mockCreateDTO, 'project-1', mockUserUpdate),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateSection', () => {
    it('should update section successfully', async () => {
      const sectionMock = {
        id: 'id',
        name: 'name',
        isArchive: false,
        projectId: 'project-1',
      };
      prisma.section.findFirst
        .mockResolvedValueOnce({ id: 'section-1', projectId: 'project-1' })
        .mockResolvedValueOnce(null);
      prisma.section.update.mockResolvedValue(sectionMock);

      const result = await service.updateSection(
        mockUpdateDTO,
        'project-1',
        'section-1',
        mockUserUpdate,
      );

      expect(prisma.section.findFirst).toHaveBeenCalledTimes(2);

      expect(prisma.section.update).toHaveBeenCalledWith({
        where: { id: 'section-1' },
        data: { name: mockUpdateDTO.name },
      });

      expect(result).toEqual({ message: 'Section modifié', data: sectionMock });
    });

    it('should throw BadRequestException if section not found', async () => {
      prisma.section.findFirst.mockResolvedValue(null);

      await expect(
        service.updateSection(
          mockUpdateDTO,
          'project-1',
          'section-1',
          mockUserUpdate,
        ),
      ).rejects.toThrow(
        new NotFoundException({ message: 'Section introuvable' }),
      );
    });

    it('should throw ForbiddenException if new name is already used', async () => {
      prisma.section.findFirst
        .mockResolvedValueOnce({ id: 'section-1', projectId: 'project-1' })
        .mockResolvedValueOnce({ id: 'section-2' });

      await expect(
        service.updateSection(
          mockUpdateDTO,
          'project-1',
          'section-1',
          mockUserUpdate,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeSection', () => {
    it('should remove section successfully with User account', async () => {
      prisma.section.findUnique.mockResolvedValue({
        id: 'section-1',
        projectId: 'project-1',
      });
      prisma.section.update.mockResolvedValue(null);
      prisma.user_Has_Project.findFirst.mockResolvedValue({
        id: 'userProjectId',
      });
      const result = await service.removeSection('section-1', userWithRoleMock);

      expect(prisma.section.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'section-1',
        },
        select: { id: true, projectId: true },
      });
      expect(prisma.user_Has_Project.findFirst).toHaveBeenCalledWith({
        where: {
          userId: userWithRoleMock.id,
          projectId: 'project-1',
          role: { name: roleProject.MODERATOR },
        },
        select: { id: true },
      });
      expect(prisma.section.update).toHaveBeenCalledWith({
        where: { id: 'section-1' },
        data: {
          isArchive: true,
        },
        select: null,
      });

      expect(result).toEqual({ message: 'Section supprimé' });
    });
    it('Should remove section with Admin account !', async () => {
      jest.spyOn(prisma.section, 'findUnique').mockResolvedValue({
        id: 'sectionId',
        projectId: 'projectId',
      });
      jest.spyOn(prisma.post, 'updateMany').mockResolvedValue(null);
      jest.spyOn(prisma.section, 'update').mockResolvedValue(null);
      await expect(
        service.removeSection('sectionId', adminWithRoleMock),
      ).resolves.toEqual({ message: 'Section supprimé' });
      expect(prisma.section.update).toHaveBeenCalledWith({
        where: { id: 'sectionId' },
        data: {
          isArchive: true,
        },
        select: null,
      });
    });
    it('should throw ForbiddenException if section not found', async () => {
      prisma.section.findUnique.mockResolvedValue(null);

      await expect(
        service.removeSection('section-1', userWithRoleMock),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.section.update).not.toHaveBeenCalled();
    });
    it('Should return a Forbidden Exception You are unauthorized !', async () => {
      jest.spyOn(prisma.section, 'findUnique').mockResolvedValue({
        id: 'sectionId',
        projectId: 'projectId',
      });
      jest.spyOn(prisma.user_Has_Project, 'findFirst').mockResolvedValue(null);
      await expect(
        service.removeSection('sectionId', userWithRoleMock),
      ).rejects.toEqual(new ForbiddenException("Vous n'êtes pas autorisé"));
    });
  });
  describe('Remove All Section', () => {
    it('Should fail Not Found Project', async () => {
      jest.spyOn(prisma.project, 'findUnique').mockReturnValue(null);
      await expect(
        service.removeAllSection('projectId', userWithRoleMock),
      ).rejects.toEqual(new NotFoundException('Projet introuvable'));
      expect(prisma.section.updateMany).not.toHaveBeenCalled();
    });
    it('Should fail Forbidden, not a moderator or admin', async () => {
      jest.spyOn(prisma.project, 'findUnique').mockReturnValue({ id: 'id' });
      jest.spyOn(prisma.user_Has_Project, 'findFirst').mockReturnValue(null);
      await expect(
        service.removeAllSection('projectId', userWithRoleMock),
      ).rejects.toEqual(new ForbiddenException("Vous n'êtes pas modérateur !"));
      expect(prisma.section.updateMany).not.toHaveBeenCalled();
    });
    it('Should delete all Section by an admin', async () => {
      const projectId = 'projectId';
      jest
        .spyOn(prisma.project, 'findUnique')
        .mockReturnValue({ id: projectId });
      jest.spyOn(prisma.section, 'updateMany');
      await expect(
        service.removeAllSection(projectId, adminWithRoleMock),
      ).resolves.toEqual({ message: 'Sections supprimé avec succes !' });
      expect(prisma.section.updateMany).toHaveBeenCalledWith({
        where: { projectId },
        data: { isArchive: true },
      });
      expect(prisma.user_Has_Project.findFirst).not.toHaveBeenCalled();
    });
    it('Should delete all Section by a moderator', async () => {
      const projectId = 'projectId';
      jest
        .spyOn(prisma.project, 'findUnique')
        .mockReturnValue({ id: projectId });
      jest
        .spyOn(prisma.user_Has_Project, 'findFirst')
        .mockReturnValue({ id: 'id' });
      jest.spyOn(prisma.section, 'updateMany');
      await expect(
        service.removeAllSection(projectId, userWithRoleMock),
      ).resolves.toEqual({ message: 'Sections supprimé avec succes !' });
      expect(prisma.section.updateMany).toHaveBeenCalledWith({
        where: { projectId },
        data: { isArchive: true },
      });
      expect(prisma.user_Has_Project.findFirst).toHaveBeenCalled();
    });
  });
});
