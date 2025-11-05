export const sectionPrismaMock = {
  user_Has_Project: {
    findFirst: jest.fn(),
  },
  section: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
  },
  project: {
    findUnique: jest.fn(),
  },
};
