import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { userMock } from 'src/auth/mock/auth.mock';
import { notificationMock } from './mock/notification.mock';
import { notificationServiceMock } from './mock/notification.service.mock';

describe('NotificationController', () => {
  let controller: NotificationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        { provide: NotificationService, useValue: notificationServiceMock },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  describe('Get my notifications', () => {
    it('Should return a list of my notification', async () => {
      await expect(controller.notifications(userMock)).resolves.toEqual({
        data: [notificationMock],
      });
    });
  });
  describe('Remove my notification', () => {
    it('Should return a message', async () => {
      await expect(
        controller.remove('notificationId', userMock),
      ).resolves.toEqual({ message: 'Notification deleted !' });
    });
  });
  describe('Remove all my notifications', () => {
    it('Should return a message', async () => {
      await expect(controller.removeAll(userMock)).resolves.toEqual({
        message: 'Notifications deleted !',
      });
    });
  });
});
