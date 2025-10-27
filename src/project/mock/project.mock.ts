export const projectMock = {
  name: 'project',
  id: '1',
  createdAt: '2025-09-06',
  updatedAt: '2025-09-06',
  section: {
    _count: {
      post: 1,
    },
  },
  users: {
    user: {
      username: 'username',
    },
  },
  _count: {
    section: 1,
    users: 1,
  },
};

export const searchMock = {
  data: { project: { id: '1', name: 'project' } },
  total: 1,
  isEndList: true,
};

export const searchAdminMock = {
  data: projectMock,
  total: 1,
  isEndList: true,
};
export const messageProjectMock = { message: 'Message' };
export const createLinkProjectMock = {
  messageProjectMock,
  data: { id: '1', outdatedAt: '2025-09-06' },
};

export const dataMemberMock = {
  data: [
    {
      user: {
        username: 'bidule',
        icon: {
          image: null,
        },
      },
      userId: 'userId',
      isBanned: false,
      isConnected: true,
    },
  ],
};
