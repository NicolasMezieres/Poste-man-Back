export const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  },
  post: {
    updateMany: jest.fn(),
  },
  section: {
    updateMany: jest.fn(),
  },
  message: { updateMany: jest.fn() },
  project: { updateMany: jest.fn() },
  $transaction: jest.fn(),
};
