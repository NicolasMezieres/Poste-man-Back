import { messageMock } from './message.mock';

export const messageServiceMock = {
  projectMessages: jest.fn().mockResolvedValue({ data: [messageMock] }),
  projectMessagesAdmin: jest.fn().mockResolvedValue({ data: [messageMock] }),
  createMessage: jest.fn().mockResolvedValue({ message: 'Message created !' }),
  deleteMessage: jest.fn().mockResolvedValue({ message: 'Message deleted !' }),
  deleteAllMessage: jest
    .fn()
    .mockResolvedValue({ message: 'Messages deleted !' }),
};
