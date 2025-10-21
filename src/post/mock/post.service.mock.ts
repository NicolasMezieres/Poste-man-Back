import { postMock } from './post.mock';

export const postServiceMock = {
  posts: jest.fn().mockResolvedValue({ data: [postMock] }),
  create: jest.fn().mockResolvedValue({ message: 'Post created !' }),
  update: jest.fn().mockResolvedValue({ message: 'Post updated !' }),
  move: jest.fn().mockResolvedValue({ message: 'Section of post changed !' }),
  vote: jest.fn().mockResolvedValue({ message: 'Voted !' }),
  remove: jest.fn().mockResolvedValue({
    message: 'Post deleted !',
  }),
  removeAll: jest
    .fn()
    .mockResolvedValue({ message: 'All post have been deleted !' }),
};
