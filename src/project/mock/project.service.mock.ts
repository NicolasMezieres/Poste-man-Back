import {
  createLinkProjectMock,
  dataMemberMock,
  messageProjectMock,
  projectMock,
  searchAdminMock,
  searchMock,
} from './project.mock';

export const projectServiceMock = {
  search: jest.fn().mockResolvedValue(searchMock),
  searchByAdmin: jest.fn().mockResolvedValue(searchAdminMock),
  getProject: jest.fn().mockResolvedValue({
    nameProject: 'nameProject',
    isModerator: false,
    isAdmin: false,
  }),
  create: jest.fn().mockResolvedValue(messageProjectMock),
  createInvitationLink: jest
    .fn()
    .mockResolvedValue({ messageProjectMock, createLinkProjectMock }),
  joinProject: jest.fn().mockResolvedValue(messageProjectMock),
  ban: jest.fn().mockResolvedValue(messageProjectMock),
  rename: jest.fn().mockResolvedValue(messageProjectMock),
  remove: jest.fn().mockResolvedValue(messageProjectMock),
  removeByAdmin: jest.fn().mockResolvedValue(messageProjectMock),
  kickUser: jest.fn().mockResolvedValue(messageProjectMock),
  listMember: jest.fn().mockResolvedValue(dataMemberMock),
  getDetail: jest.fn().mockResolvedValue({ data: projectMock }),
  getListMember: jest.fn().mockResolvedValue({ data: dataMemberMock.data }),
  getProjectListByUser: jest.fn().mockResolvedValue({ data: [] }),
};
