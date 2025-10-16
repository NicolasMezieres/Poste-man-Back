import { Test, TestingModule } from '@nestjs/testing';
import {
  mockCreateDTO,
  mockUpdateDTO,
  sectionDataMock,
} from './mock/section.mock';
import { SectionServiceMock } from './mock/section.service.mock';
import { mockUser } from './mock/user.mock';
import { SectionController } from './section.controller';
import { SectionService } from './section.service';
import { userWithRoleMock } from 'src/auth/mock/auth.mock';

describe('SectionController', () => {
  let controller: SectionController;
  let service: SectionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SectionController],
      providers: [{ provide: SectionService, useValue: SectionServiceMock }],
    }).compile();

    controller = module.get<SectionController>(SectionController);
    service = module.get<SectionService>(SectionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('get all section by user', () => {
    it('Should return list of section', async () => {
      await expect(
        controller.sections('projectId', userWithRoleMock),
      ).resolves.toEqual(sectionDataMock);
      expect(service.sections).toHaveBeenCalledWith(
        'projectId',
        userWithRoleMock,
      );
    });
  });

  describe('createSection', () => {
    it('should call service.createSection and return message', async () => {
      SectionServiceMock.createSection.mockResolvedValue({
        message: 'Section create',
      });
      const result = await controller.createSection(
        mockCreateDTO,
        'project-1',
        mockUser,
      );
      expect(result).toEqual({ message: 'Section create' });
      expect(service.createSection).toHaveBeenCalledWith(
        mockCreateDTO,
        'project-1',
        mockUser,
      );
    });
  });

  describe('updateSection', () => {
    it('should call service.updateSection and return message', async () => {
      SectionServiceMock.updateSection.mockResolvedValue({
        message: 'Section Update',
      });
      const result = await controller.updateSection(
        mockUpdateDTO,
        'project-1',
        'section-1',
        mockUser,
      );
      expect(result).toEqual({ message: 'Section Update' });
      expect(service.updateSection).toHaveBeenCalledWith(
        mockUpdateDTO,
        'project-1',
        'section-1',
        mockUser,
      );
    });
  });

  describe('removeSection', () => {
    it('should call service.removeSection and return message', async () => {
      SectionServiceMock.removeSection.mockResolvedValue({
        message: 'Section has been deleted',
      });

      const result = await controller.removeSection(
        'project-1',
        'section-1',
        mockUser,
      );
      expect(result).toEqual({ message: 'Section has been deleted' });
      expect(service.removeSection).toHaveBeenCalledWith(
        'project-1',
        'section-1',
        mockUser,
      );
    });
  });
});
