export const postPrismaMock = {
  section: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  user_Has_Project: {
    findFirst: jest.fn(),
  },
  post: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  vote: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
};
