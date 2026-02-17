import { Response } from 'express';
import { role } from 'src/utils/enum';

export const messageMock = { message: 'message' };
export const signupMessageMock = {
  message: 'Votre compte à été créer !',
};
export const signinResponseMock = {
  message: 'Connexion réussi',
  role: 'role',
};

export const tokenMock = { connexion_token: 'jwtToken' };
export const resMock = { cookie: jest.fn() } as unknown as Response;
export const cookieRuleMock = {
  httpOnly: true,
  sameSite: process.env.IS_PRODUCTION === 'true' ? 'none' : 'lax',
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
  icon: null,
  firstName: 'Unit',
  lastName: 'TestUnit',
  username: 'UnitTest',
  password: 'StrongP@ssword123',
  email: 'user@example.com',
  isActive: true,
  isArchive: false,
  activateToken: '',
  gdpr: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const userWithRoleMock = {
  id: '1',
  isActive: true,
  firstName: 'firstName',
  lastName: 'lastName',
  username: 'username',
  email: 'example@gmail.com',
  role: {
    name: role.USER,
  },
};

export const adminMock = {
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
export const adminWithRoleMock = {
  id: '2',
  isActive: true,
  firstName: 'firstName',
  lastName: 'lastName',
  username: 'username',
  email: 'example@gmail.com',
  role: {
    name: role.ADMIN,
  },
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
