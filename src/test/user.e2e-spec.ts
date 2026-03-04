import { NotFoundException } from '@nestjs/common';
import { app, cookie, cookieAdmin, prisma } from './setup.e2e';
import * as req from 'supertest';
import { resMessageType } from 'src/utils/type';
describe('Section (e2e)', () => {
  let cookieUserE2E: string;
  let userId: string;
  beforeAll(async () => {
    const signupDTO = {
      firstName: 'userE2E',
      lastName: 'userE2E',
      email: 'userE2E@email.com',
      username: 'usernameE2E',
      password: 'strongP@ssword73',
    };
    await req(app.getHttpServer())
      .post('/auth/signup')
      .send(signupDTO)
      .expect(201);
    const token = await prisma.user.findUnique({
      where: { username: signupDTO.username },
      select: { activateToken: true, id: true },
    });
    if (!token) {
      throw new NotFoundException('User not found');
    }
    userId = token.id;
    await req(app.getHttpServer())
      .patch(`/auth/activationAccount/${token.activateToken}`)
      .expect(200);
    const resCookie = await req(app.getHttpServer())
      .post('/auth/signin')
      .send({ identifier: signupDTO.username, password: signupDTO.password })
      .expect(201);
    if (resCookie) {
      cookieUserE2E = resCookie.headers['set-cookie'];
    }
  });
  afterAll(async () => {
    await prisma.user.delete({
      where: { id: userId },
    });
  });
  describe('/ (GET) MyAccount', () => {
    const path = '/user/myAccount';
    it('Should fail Need a Cookie', async () => {
      return req(app.getHttpServer())
        .get(path)
        .expect(401)
        .expect((res: resMessageType) =>
          expect(res.body.message).toContain('Unauthorized'),
        );
    });
    it('Should Get my data', async () => {
      return req(app.getHttpServer())
        .get(path)
        .set('Cookie', cookieUserE2E)
        .expect(200);
    });
  });
  describe('/ (PATCH) MyAccount', () => {
    const path = '/user/myAccount';
    const updateAccountDTO = {
      firstName: '',
      lastName: '',
      email: '',
      username: '',
    };
    it('Should fail Need a Cookie', async () => {
      return req(app.getHttpServer())
        .get(path)
        .expect(401)
        .expect((res: resMessageType) =>
          expect(res.body.message).toContain('Unauthorized'),
        );
    });
    it('Should fail dto firstName', async () => {
      return req(app.getHttpServer())
        .patch(path)
        .set('Cookie', cookieUserE2E)
        .send(updateAccountDTO)
        .expect(400)
        .expect((res: resMessageType) =>
          expect(res.body.message[0]).toContain('firstName'),
        );
    });
    it('Should fail dto lastName', async () => {
      updateAccountDTO.firstName = 'bidule';
      return req(app.getHttpServer())
        .patch(path)
        .set('Cookie', cookieUserE2E)
        .send(updateAccountDTO)
        .expect(400)
        .expect((res: resMessageType) =>
          expect(res.body.message[0]).toContain('lastName'),
        );
    });
    it('Should fail dto username', async () => {
      updateAccountDTO.lastName = 'lastName';
      return req(app.getHttpServer())
        .patch(path)
        .set('Cookie', cookieUserE2E)
        .send(updateAccountDTO)
        .expect(400)
        .expect((res: resMessageType) =>
          expect(res.body.message[0]).toContain('username'),
        );
    });
    it('Should fail dto email', async () => {
      updateAccountDTO.username = 'username';
      return req(app.getHttpServer())
        .patch(path)
        .set('Cookie', cookieUserE2E)
        .send(updateAccountDTO)
        .expect(400)
        .expect((res: resMessageType) =>
          expect(res.body.message[0]).toContain('email'),
        );
    });
    it('Should update with same username and email', async () => {
      updateAccountDTO.email = 'userE2E@email.com';
      updateAccountDTO.username = 'usernameE2E';

      return req(app.getHttpServer())
        .patch(path)
        .set('Cookie', cookieUserE2E)
        .send(updateAccountDTO)
        .expect(200);
    });
    it('Should update with username and email not used', async () => {
      updateAccountDTO.email = 'userE2E3@email.com';
      updateAccountDTO.username = 'usernameE2E3';

      return req(app.getHttpServer())
        .patch(path)
        .set('Cookie', cookieUserE2E)
        .send(updateAccountDTO)
        .expect(200);
    });
    it('Should fail username already used', async () => {
      updateAccountDTO.username = 'user3';

      return req(app.getHttpServer())
        .patch(path)
        .set('Cookie', cookieUserE2E)
        .send(updateAccountDTO)
        .expect(403)
        .expect((res: resMessageType) =>
          expect(res.body.message).toContain('Pseudonyme'),
        );
    });
    it('Should fail email already used', async () => {
      updateAccountDTO.email = 'email2@email.com';

      return req(app.getHttpServer())
        .patch(path)
        .set('Cookie', cookieUserE2E)
        .send(updateAccountDTO)
        .expect(403)
        .expect((res: resMessageType) =>
          expect(res.body.message).toContain('Email'),
        );
    });
  });
  describe('/(PATCH) changePassword', () => {
    const path = '/user/changePassword';
    it('Should fail, Need a cookie (401)', async () => {
      return req(app.getHttpServer())
        .patch(path)
        .expect(401)
        .expect((res: resMessageType) =>
          expect(res.body.message).toContain('Unauthorized'),
        );
    });
    it('Should fail, dto error (400)', async () => {
      return req(app.getHttpServer())
        .patch(path)
        .set('Cookie', cookie)
        .expect(400)
        .expect((err: resMessageType) =>
          expect(err.body.message[0]).toContain('password'),
        );
    });
    it('Should fail, invalid verify password (403)', async () => {
      return req(app.getHttpServer())
        .patch(path)
        .set('Cookie', cookie)
        .send({
          oldPassword: 'OldOtherP@ssword73',
          password: 'StrongP@ssword73',
        })
        .expect(403)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('incorrecte'),
        );
    });
    it('Should succes, password changed', async () => {
      return req(app.getHttpServer())
        .patch(path)
        .set('Cookie', cookie)
        .send({
          oldPassword: 'StrongP@ssword73',
          password: 'StrongP@ssword73',
        })
        .expect(200);
    });
  });
  describe('changeAvatar', () => {
    const path = '/user/changeAvatar';
    it('Should fail, Need a cookie (401)', async () => {
      return req(app.getHttpServer())
        .patch(path)
        .expect(401)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Unauthorized'),
        );
    });
    it('Should fail invalid dto (400)', async () => {
      return req(app.getHttpServer())
        .patch(path)
        .set('Cookie', cookie)
        .expect(400)
        .expect((err: resMessageType) =>
          expect(err.body.message[0]).toContain('icon'),
        );
    });
    it('Should succes avatar changed (200)', async () => {
      return req(app.getHttpServer())
        .patch(path)
        .set('Cookie', cookie)
        .send({ icon: 'cat' })
        .expect(200);
    });
  });
  describe('deleteAccount', () => {
    const path = '/user/account/desactivate';
    it('Should succes', async () => {
      return req(app.getHttpServer())
        .delete(path)
        .set('Cookie', cookieUserE2E)
        .expect(200);
    });
    it('Should fail, need a cookie (401)', async () => {
      return req(app.getHttpServer())
        .delete(path)
        .expect(401)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Unauthorized'),
        );
    });
  });
  describe('searchUser (admin)', () => {
    const path = '/user/userList';
    it('Should fail, need a cookie (401)', async () => {
      return req(app.getHttpServer())
        .get(path)
        .expect(401)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Unauthorized'),
        );
    });
    it('Should fail, not an admin (401)', async () => {
      return req(app.getHttpServer())
        .get(path)
        .set('Cookie', cookie)
        .expect(401)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('not authorized'),
        );
    });
    it('Should succes', async () => {
      return req(app.getHttpServer())
        .get(path)
        .set('Cookie', cookieAdmin)
        .expect(200);
    });
  });
  describe('banUser (admin)', () => {
    const path = '/user/';
    it('Should fail, need a cookie (401)', async () => {
      return req(app.getHttpServer())
        .patch(path + 'id/ban')
        .expect(401)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Unauthorized'),
        );
    });
    it('Should fail, not an admin (401)', async () => {
      return req(app.getHttpServer())
        .patch(path + 'id/ban')
        .set('Cookie', cookie)
        .expect(401)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('not authorized'),
        );
    });
    it('Should fail, user not found (404)', async () => {
      return req(app.getHttpServer())
        .patch(path + 'id/ban')
        .set('Cookie', cookieAdmin)
        .expect(404)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Utilisateur introuvable'),
        );
    });
    it('Should succes', async () => {
      return req(app.getHttpServer())
        .patch(path + `${userId}/ban`)
        .set('Cookie', cookieAdmin)
        .expect(200);
    });
  });
  describe('deleteUser (admin)', () => {
    const path = '/user/';
    it('Should fail, need a cookie (401)', async () => {
      return req(app.getHttpServer())
        .delete(path + 'id/delete')
        .expect(401)
        .expect((res: resMessageType) =>
          expect(res.body.message).toContain('Unauthorized'),
        );
    });
    it('Should fail, not an admin (401)', async () => {
      return req(app.getHttpServer())
        .delete(path + 'id/delete')
        .expect(401)
        .set('Cookie', cookie)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('not authorized'),
        );
    });
    it('Should fail, user not found (404)', async () => {
      return req(app.getHttpServer())
        .delete(path + 'id/delete')
        .set('Cookie', cookieAdmin)
        .expect(404)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Utilisateur introuvable'),
        );
    });
    it('Should succes', async () => {
      return req(app.getHttpServer())
        .delete(path + `${userId}/delete`)
        .set('Cookie', cookieAdmin)
        .expect(200);
    });
  });
  describe('/ (GET) detailUser', () => {
    const path = '/user/userId/detail';
    it('Should fail, need an cookie admin', async () => {
      return req(app.getHttpServer())
        .get(path)
        .set('Cookie', cookie)
        .expect(401);
    });
    it('Should fail, user not found', async () => {
      return req(app.getHttpServer())
        .get(path)
        .set('Cookie', cookieAdmin)
        .expect(404);
    });
    it('Should succes', async () => {
      return req(app.getHttpServer())
        .get(`/user/${userId}/detail`)
        .set('Cookie', cookieAdmin)
        .expect(200);
    });
  });
});
