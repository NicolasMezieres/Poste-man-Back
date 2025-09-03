import { Response } from 'express';

export const messageMock = { message: 'message' };
export const signupMessageMock = {
  message: 'Your account as been create !',
};
export const signinResponseMock = {
  message: 'Connexion succesfully',
  role: 'role',
};

export const tokenMock = { connexion_token: 'jwtToken' };
export const resMock = { cookie: jest.fn() } as unknown as Response;
export const cookieRuleMock = {
  httpOnly: true,
  sameSite: 'none',
  maxAge: 1000 * 60 * 60 * 24 * 7,
  secure: process.env.IS_PRODUCTION === 'true' ? true : false,
};

export const roleMock = {
  id: 1,
  role: 'role',
};

export const userMock = {
  id: '1',
  roleId: '1',
  iconId: null,
  firstName: 'Unit',
  lastName: 'TestUnit',
  username: 'UnitTest',
  password: 'StrongP@ssword123',
  email: 'user@example.com',
  isActive: true,
  activateToken: '',
  gdpr: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const adminMok = {
  id: '2',
  roleId: '2',
  iconId: null,
  firstName: 'adminMock',
  lastName: 'mockAdmin',
  username: 'MrAdmin',
  password: 'StrongP@ssword123',
  email: 'admin@example.com',
  isActive: true,
  activateToken: '',
  gdpr: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// export const superAdminMock = {
//   id: '3',
//   roleId: '3',
//   firstName: 'superAdminMock',
//   lastName: 'mockAdminSuper',
//   username: 'MrSupeadmin',
//   password: 'StrongP@ssword123',
//   email: 'superadmin@example.com',
//   isActive: true,
//   activateToken: '',
//   gdpr: true,
//   createdAt: new Date(),
//   updatedAt: new Date(),
// };
