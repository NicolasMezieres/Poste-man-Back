import { userMock } from 'src/auth/mock/auth.mock';

export const mockUser = {
  id: '1',
  roleId: '1',
  iconId: 1,
  firstName: 'Plopi',
  lastName: 'Plop',
  email: 'plopiplop@example.com',
  username: 'Plopiplop',
  password: 'StrongP@ssword123',
  isActive: true,
  isArchive: false,
  activateToken: null,
  gdpr: true,
  createdAt: new Date('2025-09-06'),
  updatedAt: new Date('2025-09-06'),
  role: {
    id: '1',
    name: 'MEMBER',
  },
  icon: '',
  participationProject: [],
  message: [],
  post: [],
  notif: [],
};

export const mockUserUpdate = {
  id: '1',
  roleId: '1',
  iconId: 1,
  firstName: 'Plopi',
  lastName: 'PlopUpdate',
  email: 'plopiplop@example.com',
  username: 'Plopiplopupdate',
  password: 'StrongP@ssword123',
  isActive: true,
  isArchive: false,
  activateToken: null,
  gdpr: true,
  icon: '',
  createdAt: new Date('2025-09-06'),
  updatedAt: new Date('2025-09-06'),
  role: {
    id: '1',
    name: 'MEMBER',
  },
  participationProject: [],
  message: [],
  post: [],
  notif: [],
};

export const detailUserMock = {
  email: userMock.email,
  firstName: userMock.firstName,
  lastName: userMock.lastName,
  isActive: userMock.isActive,
  gdpr: userMock.gdpr,
  createdAt: userMock.createdAt,
  updatedAt: userMock.updatedAt,
  username: userMock.username,
};
