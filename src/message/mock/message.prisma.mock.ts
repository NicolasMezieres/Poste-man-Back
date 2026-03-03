export const messagePrismaMock = {
  message: {
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  project: {
    findUnique: jest.fn(),
  },
  user_Has_Project: {
    findFirst: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};
