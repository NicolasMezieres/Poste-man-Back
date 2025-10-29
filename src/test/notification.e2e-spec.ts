import { resMessageType } from 'src/utils/type';
import * as req from 'supertest';
import { app, cookie, prisma } from './setup.e2e';
import { NotFoundException } from '@nestjs/common';
describe('Notification (e2e)', () => {
  let notificationId: number;
  beforeAll(async () => {
    const existingUser = await prisma.user.findUnique({
      where: { username: 'user2' },
      select: { id: true },
    });
    if (!existingUser) {
      throw new NotFoundException('User not found !');
    }
    const notification = await prisma.notification.create({
      data: {
        projectId: 'projectId',
        userId: existingUser.id,
        text: 'text',
        theme: 'theme',
      },
      select: { id: true },
    });
    notificationId = notification.id;
  });
  afterAll(async () => {
    await prisma.notification.deleteMany();
  });
  describe('/ (GET) my notifications', () => {
    const path = '/notification';
    it('Should fail Need a Cookie', async () => {
      return req(app.getHttpServer())
        .get(path)
        .expect(401)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Unauthorized'),
        );
    });
    it('Should return my notifications', async () => {
      return req(app.getHttpServer())
        .get(path)
        .set('Cookie', cookie)
        .expect(200);
    });
  });
  describe('/ (DELETE) Remove my Notification', () => {
    const path = '/notification/';
    it('Should fail Need a Cookie', async () => {
      return req(app.getHttpServer())
        .delete(path + 'notificationId')
        .expect(401)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Unauthorized'),
        );
    });
    it('Should fail Forbidden Exception, notificationId is not a valid Id', async () => {
      return req(app.getHttpServer())
        .delete(path + 'notificationId')
        .set('Cookie', cookie)
        .expect(403)
        .expect((err: resMessageType) =>
          expect(err.body.message).toEqual('Notification is not a valid id'),
        );
    });
    it('Should fail Not Found Exception, Notification not found', async () => {
      return req(app.getHttpServer())
        .delete(path + '-1')
        .set('Cookie', cookie)
        .expect(404)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Notification'),
        );
    });
    it('Should remove my notification', async () => {
      return req(app.getHttpServer())
        .delete(path + notificationId)
        .set('Cookie', cookie)
        .expect(200);
    });
  });
  describe('/ (DELETE) Remove my Notifications', () => {
    const path = '/notification/all';
    it('Should fail Need a Cookie', async () => {
      return req(app.getHttpServer())
        .delete(path)
        .expect(401)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Unauthorized'),
        );
    });
    it('Should My Notifications Deleted', async () => {
      return req(app.getHttpServer())
        .delete(path)
        .set('Cookie', cookie)
        .expect(200);
    });
  });
});
