import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { notificationPrismaMock } from './mock/notification.prisma.mock';
import { notificationMock } from './mock/notification.mock';
import { userMock } from 'src/auth/mock/auth.mock';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: PrismaService, useValue: notificationPrismaMock },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });
  afterEach(() => {
    jest.resetAllMocks();
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('Get notifications of user ', () => {
    it('Should return a list of notification', async () => {
      jest
        .spyOn(notificationPrismaMock.notification, 'findMany')
        .mockResolvedValue(notificationMock);
      await expect(service.notifications(userMock)).resolves.toEqual({
        data: notificationMock,
      });
    });
  });
  describe('Create notifications to each user of project', () => {
    it('Should create notification', async () => {
      jest
        .spyOn(notificationPrismaMock.notification, 'createMany')
        .mockResolvedValue(null);
      await expect(
        service.createMany(
          [{ projectId: 'projectId', userId: 'userId' }],
          'theme',
          'text',
        ),
      ).resolves.toEqual(undefined);
    });
  });
  describe('Remove notification', () => {
    it('Should delete notification', async () => {
      jest
        .spyOn(notificationPrismaMock.notification, 'findFirst')
        .mockResolvedValue(notificationMock);
      jest
        .spyOn(notificationPrismaMock.notification, 'delete')
        .mockResolvedValue(null);
      await expect(service.remove('1', userMock)).resolves.toEqual({
        message: 'Notification supprimer !',
      });
    });
    it('Should return Forbidden Exception, Notification is not a valid id', async () => {
      await expect(service.remove('test', userMock)).rejects.toEqual(
        new ForbiddenException('Notification invalide'),
      );
      expect(notificationPrismaMock.notification.delete).not.toHaveBeenCalled();
    });
    it('Should return Not Found Exception, Notification not found !', async () => {
      jest
        .spyOn(notificationPrismaMock.notification, 'findFirst')
        .mockResolvedValue(null);
      await expect(service.remove('1', userMock)).rejects.toEqual(
        new NotFoundException('Notification introuvable !'),
      );
      expect(notificationPrismaMock.notification.delete).not.toHaveBeenCalled();
    });
  });
  describe('Remove all notification from user', () => {
    it('Should remove all notifications', async () => {
      jest
        .spyOn(notificationPrismaMock.notification, 'deleteMany')
        .mockResolvedValue(null);
      await expect(service.removeAll(userMock)).resolves.toEqual({
        message: 'Notifications supprimer !',
      });
      expect(
        notificationPrismaMock.notification.deleteMany,
      ).toHaveBeenCalledWith({ where: { userId: userMock.id } });
    });
  });
});
