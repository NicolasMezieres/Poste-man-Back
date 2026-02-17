import { notificationMock } from './notification.mock';

export const notificationServiceMock = {
  notifications: jest.fn().mockResolvedValue({ data: [notificationMock] }),
  remove: jest.fn().mockResolvedValue({ message: 'Notification deleted !' }),
  removeAll: jest
    .fn()
    .mockResolvedValue({ message: 'Notifications deleted !' }),
};
