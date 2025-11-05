// __mocks__/user.mock.ts

export const mockUser = {
  id: '1',
  roleId: '1',
  iconId: 1,
  firstName: 'Tomate',
  lastName: 'Ketchup',
  email: 'tomate.ketchup@example.com',
  username: 'Tomato',
  password: 'StrongP@ssword123',
  isActive: true,
  isArchive: false,
  activateToken: null,
  gdpr: true,
  createdAt: new Date('2025-09-06'),
  updatedAt: new Date('2025-09-06'),
  icon: {
    id: 1,
    url: 'https://example.com/icon.png',
  },
  role: {
    id: '1',
    name: 'MODERATOR',
  },
  participationProject: [],
  message: [],
  post: [],
  notif: [],
};
