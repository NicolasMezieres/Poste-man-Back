export const SectionServiceMock = {
  createSection: jest.fn().mockResolvedValue({ message: 'Section create' }),
  updateSection: jest.fn().mockResolvedValue({ message: 'Section Update' }),
  removeSection: jest
    .fn()
    .mockResolvedValue({ message: 'Section has been deleted' }),
};
