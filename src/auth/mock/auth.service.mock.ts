import {
  messageMock,
  signinResponseMock,
  signupMessageMock,
  tokenMock,
} from './auth.mock';

export const AuthServiceMock = {
  signup: jest.fn().mockResolvedValue(signupMessageMock),
  signToken: jest.fn().mockResolvedValue(tokenMock),
  activationAccount: jest.fn().mockResolvedValue(messageMock),
  signin: jest.fn().mockResolvedValue(signinResponseMock),
  forgetPassword: jest.fn().mockResolvedValue(messageMock),
  resetPassword: jest.fn().mockResolvedValue(messageMock),
};
