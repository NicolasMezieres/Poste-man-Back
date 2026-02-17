export const sectionMock = {
  id: 'section-1',
  name: 'Section A',
  projectId: '1',
  createdAt: new Date('2025-09-06'),
  updatedAt: new Date('2025-09-06'),
  project: {
    id: '1',
    users: [
      {
        userId: '1',
        role: { name: 'MODERATOR' },
      },
    ],
  },
};

export const mockCreateDTO = {
  name: 'Section',
};

export const mockUpdateDTO = {
  name: 'Section1',
};

export const roleProject = {
  MODERATOR: 'Moderator',
};

export const sectionDataMock = {
  section: [
    {
      name: 'section',
      id: 'sectionId',
    },
  ],
};
