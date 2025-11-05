export const mockUpdateMany = jest.fn();

export const mockPrismaService = {
  user: {
    updateMany: mockUpdateMany,
  },
};
