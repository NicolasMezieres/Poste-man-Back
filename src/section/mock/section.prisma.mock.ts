export const sectionPrismaMock = {
  user_Has_Project: {
    findFirst: jest.fn(),
  },
  section: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
  },
};
