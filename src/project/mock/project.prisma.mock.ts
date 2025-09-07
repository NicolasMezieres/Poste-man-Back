export const projectPrismaMock = {
  user_Has_Project: {
    count: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  project: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  role_Project: { findUnique: jest.fn() },
  link_Project: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
  },
  post: { deleteMany: jest.fn() },
  section: { deleteMany: jest.fn() },
  message: { deleteMany: jest.fn() },
  $transaction: jest.fn(),
};
