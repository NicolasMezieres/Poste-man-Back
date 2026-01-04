import { messageMock } from './message.mock';

export const messageServiceMock = {
  projectName: jest.fn().mockResolvedValue({ projectName: 'projectName' }),
  projectMessages: jest.fn().mockResolvedValue({ data: [messageMock] }),
  projectMessagesAdmin: jest.fn().mockResolvedValue({ data: [messageMock] }),
  createMessage: jest.fn().mockResolvedValue({ message: 'Message created !' }),
  deleteMessage: jest.fn().mockResolvedValue({ message: 'Message deleted !' }),
  deleteAllMessage: jest
    .fn()
    .mockResolvedValue({ message: 'Messages deleted !' }),
  joinRoomMessage: jest.fn().mockResolvedValue(null),
};
