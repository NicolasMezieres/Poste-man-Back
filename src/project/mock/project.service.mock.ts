import {
  createLinkProjectMock,
  messageProjectMock,
  searchAdminMock,
  searchMock,
} from './project.mock';

export const projectServiceMock = {
  search: jest.fn().mockResolvedValue(searchMock),
  searchByAdmin: jest.fn().mockResolvedValue(searchAdminMock),
  create: jest.fn().mockResolvedValue(messageProjectMock),
  createInvitationLink: jest
    .fn()
    .mockResolvedValue({ messageProjectMock, createLinkProjectMock }),
  joinProject: jest.fn().mockResolvedValue(messageProjectMock),
  ban: jest.fn().mockResolvedValue(messageProjectMock),
  rename: jest.fn().mockResolvedValue(messageProjectMock),
  remove: jest.fn().mockResolvedValue(messageProjectMock),
  removeByAdmin: jest.fn().mockResolvedValue(messageProjectMock),
};
