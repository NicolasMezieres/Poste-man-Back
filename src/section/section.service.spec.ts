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
    it('Should return a section list with an account user', async () => {
      jest
        .spyOn(prisma.project, 'findUnique')
        .mockResolvedValue({ section: sectionDataMock, id: 'projectId' });
      jest
        .spyOn(prisma.user_Has_Project, 'findFirst')
        .mockResolvedValue({ id: 'id' });
      await expect(
        service.sections('projectId', userWithRoleMock),
      ).resolves.toEqual({ data: sectionDataMock });
    });
    it('Should return a section list with an account admin', async () => {
      jest
        .spyOn(prisma.project, 'findUnique')
        .mockResolvedValue({ section: sectionDataMock, id: 'projectId' });
      jest.spyOn(prisma.user_Has_Project, 'findFirst').mockResolvedValue(null);
      await expect(
        service.sections('projectId', adminWithRoleMock),
      ).resolves.toEqual({ data: sectionDataMock });
    });
    it('Should return a Not Found Exception', async () => {
      jest.spyOn(prisma.project, 'findUnique').mockResolvedValue(null);
      await expect(
        service.sections('projectId', userWithRoleMock),
      ).rejects.toEqual(new NotFoundException('Project not found !'));
    });
    it('Should return a Forbidden Exception', async () => {
      jest
        .spyOn(prisma.project, 'findUnique')
        .mockResolvedValue({ section: sectionDataMock, id: 'projectId' });
      jest.spyOn(prisma.user_Has_Project, 'findFirst').mockResolvedValue(null);
      await expect(
        service.sections('projectId', userWithRoleMock),
      ).rejects.toEqual(new ForbiddenException('You are unauthorized !'));
    });
  });
  describe('createSection', () => {
    it('should create a section successfully', async () => {
      prisma.user_Has_Project.findFirst.mockResolvedValue({ id: 'up-1' });
      prisma.section.findFirst.mockResolvedValue(null);
      prisma.section.create.mockResolvedValue(null);

      const result = await service.createSection(
        mockCreateDTO,
        'project-1',
        mockUser,
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
        where: { name: mockCreateDTO.name, project: { id: 'project-1' } },
        select: { id: true },
      });

      expect(prisma.section.create).toHaveBeenCalledWith({
        data: { name: mockCreateDTO.name, projectId: 'project-1' },
        select: null,
      });

      expect(result).toEqual({ message: 'Section create' });
    });

    it('should throw ForbiddenException if user project not found', async () => {
      prisma.user_Has_Project.findFirst.mockResolvedValue(null);

      await expect(
        service.createSection(mockCreateDTO, 'project-1', mockUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if section name exists', async () => {
      prisma.user_Has_Project.findFirst.mockResolvedValue({ id: 'up-1' });
      prisma.section.findFirst.mockResolvedValue({ id: 'section-1' });

      await expect(
        service.createSection(mockCreateDTO, 'project-1', mockUser),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateSection', () => {
    it('should update section successfully', async () => {
      prisma.section.findFirst
        .mockResolvedValueOnce({ id: 'section-1', projectId: 'project-1' })
        .mockResolvedValueOnce(null);
      prisma.section.update.mockResolvedValue(null);

      const result = await service.updateSection(
        mockUpdateDTO,
        'project-1',
        'section-1',
        mockUser,
      );

      expect(prisma.section.findFirst).toHaveBeenCalledTimes(2);

      expect(prisma.section.update).toHaveBeenCalledWith({
        where: { id: 'section-1' },
        data: { name: mockUpdateDTO.name },
        select: null,
      });

      expect(result).toEqual({ message: 'Section Update' });
    });

    it('should throw BadRequestException if section not found', async () => {
      prisma.section.findFirst.mockResolvedValue(null);

      await expect(
        service.updateSection(
          mockUpdateDTO,
          'project-1',
          'section-1',
          mockUser,
        ),
      ).rejects.toThrow(BadRequestException);
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
          mockUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeSection', () => {
    it('should remove section successfully', async () => {
      prisma.section.findUnique.mockResolvedValue({
        id: 'section-1',
        projectId: 'project-1',
      });
      prisma.section.delete.mockResolvedValue(null);

      const result = await service.removeSection(
        'project-1',
        'section-1',
        mockUser,
      );

      expect(prisma.section.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'section-1',
          project: {
            id: 'project-1',
            users: {
              some: {
                userId: mockUser.id,
                role: { name: roleProject.MODERATOR },
              },
            },
          },
        },
        select: { id: true, projectId: true },
      });

      expect(prisma.section.delete).toHaveBeenCalledWith({
        where: { id: 'section-1' },
        select: null,
      });

      expect(result).toEqual({ message: 'Section has been deleted' });
    });

    it('should throw ForbiddenException if section not found', async () => {
      prisma.section.findUnique.mockResolvedValue(null);

      await expect(
        service.removeSection('project-1', 'section-1', mockUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
