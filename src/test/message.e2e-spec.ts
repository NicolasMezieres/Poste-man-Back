import * as req from 'supertest';
import {
  app,
  cookie,
  cookieAdmin,
  cookieOtherUser,
  getProject,
  prisma,
} from './setup.e2e';
import { resMessageType } from 'src/utils/type';
import { NotFoundException } from '@nestjs/common';
describe('Message (e2e)', () => {
  let projectId: string;
  beforeAll(async () => {
    await req(app.getHttpServer())
      .post('/project/create')
      .set('Cookie', cookie)
      .send({ name: 'messageSpec' })
      .expect(201);
    projectId = await getProject('messageSpec');
  });
  afterAll(async () => {
    await prisma.link_Project.deleteMany({
      where: { projet: { name: { contains: 'messageSpec' } } },
    });
    await prisma.project.deleteMany({
      where: { name: { contains: 'messageSpec' } },
    });
  });
  describe('/ (GET) messages of project', () => {
    const path = '/message/project/';
    it('Should fail Need a Cookie', async () => {
      return req(app.getHttpServer())
        .get(path + 'projectId')
        .expect(401)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Unauthorized'),
        );
    });
    it('Should fail Not Found Exception, Project not found', async () => {
      return req(app.getHttpServer())
        .get(path + 'projectId')
        .set('Cookie', cookie)
        .expect(404)
        .expect((res: resMessageType) =>
          expect(res.body.message).toContain('Project'),
        );
    });
    it('Should fail Forbidden Exception, Not a Member or an Admin', async () => {
      await req(app.getHttpServer())
        .post('/project/create')
        .set('Cookie', cookie)
        .send({ name: 'messageSpecE2E' })
        .expect(201);
      return req(app.getHttpServer())
        .get(path + projectId)
        .set('Cookie', cookieOtherUser)
        .expect(403)
        .expect((res: resMessageType) =>
          expect(res.body.message).toContain('unauthorized'),
        );
    });
    it('Should fail Forbidden Exception, Not a Member or an Admin', async () => {
      return req(app.getHttpServer())
        .get(path + projectId)
        .set('Cookie', cookie)
        .expect(200);
    });
    it('Should fail Forbidden Exception, Not a Member or an Admin', async () => {
      return req(app.getHttpServer())
        .get(path + projectId)
        .set('Cookie', cookieAdmin)
        .expect(200);
    });
  });
  describe('/ (POST) Create Message', () => {
    const path = '/message/project/';
    const messageDTO = { message: 'message' };
    it('Should fail Need a Cookie', async () => {
      return req(app.getHttpServer())
        .post(path + 'projectId')
        .expect(401)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Unauthorized'),
        );
    });
    it('Should fail Bad Request Exception, message', async () => {
      return req(app.getHttpServer())
        .post(path + 'projectId')
        .set('Cookie', cookieOtherUser)
        .expect(400)
        .expect((err: resMessageType) =>
          expect(err.body.message[0]).toContain('message'),
        );
    });
    it('Should fail Project not found', async () => {
      return req(app.getHttpServer())
        .post(path + 'projectId')
        .set('Cookie', cookie)
        .send(messageDTO)
        .expect(404)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Project not found !'),
        );
    });
    it('Should Create Message', async () => {
      return req(app.getHttpServer())
        .post(path + projectId)
        .set('Cookie', cookie)
        .send(messageDTO)
        .expect(201);
    });
  });
  describe('/ (DELETE) Delete Message', () => {
    const path = '/message/';
    let messageId: string;
    it('Should fail Need a Cookie', async () => {
      return req(app.getHttpServer())
        .delete(path + 'messageId')
        .expect(401)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Unauthorized'),
        );
    });
    it('Should fail Not Found Exception, Message not found', async () => {
      return req(app.getHttpServer())
        .delete(path + 'messageId')
        .set('Cookie', cookie)
        .expect(404)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Message'),
        );
    });
    it('Should fail Forbidden Exception, Not a Member or Admin', async () => {
      const existingMessage = await prisma.message.findFirst({
        select: { id: true },
      });
      if (!existingMessage) {
        throw new NotFoundException('Message not found!');
      }
      messageId = existingMessage.id;
      return req(app.getHttpServer())
        .delete(path + messageId)
        .set('Cookie', cookieOtherUser)
        .expect(403)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('unauthorized'),
        );
    });

    it('Should fail Forbidden Exception, Not a Moderator, Admin, or Author of this message', async () => {
      const res: { body: { data: { id: string } } } = await req(
        app.getHttpServer(),
      )
        .post(`/project/${projectId}/link`)
        .set('Cookie', cookie)
        .expect(201);
      await req(app.getHttpServer())
        .post(`/project/${res.body.data.id}/join`)
        .set('Cookie', cookieOtherUser)
        .expect(201);
      return req(app.getHttpServer())
        .delete(path + messageId)
        .set('Cookie', cookieOtherUser)
        .expect(403)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('unauthorized'),
        );
    });
    it('Should Message Deleted by Moderator', async () => {
      return req(app.getHttpServer())
        .delete(path + messageId)
        .set('Cookie', cookie)
        .expect(200);
    });
    it('Should Message Deleted by Admin', async () => {
      await req(app.getHttpServer())
        .post(path + `project/${projectId}`)
        .set('Cookie', cookie)
        .send({ message: 'new other message' })
        .expect(201);
      const newMessage = await prisma.message.findFirst({
        where: { message: 'new other message' },
        select: { id: true },
      });
      if (!newMessage) {
        throw new NotFoundException('Message not found');
      }
      return req(app.getHttpServer())
        .delete(path + newMessage.id)
        .set('Cookie', cookieAdmin)
        .expect(200);
    });
  });
  describe('/ (DELETE) Delete Messages of project', () => {
    const path = '/message/project/';
    it('Should fail Need a Cookie', async () => {
      return req(app.getHttpServer())
        .delete(path + 'projectId')
        .expect(401)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Unauthorized'),
        );
    });
    it('Should fail Not Found Exception, Project not found', async () => {
      return req(app.getHttpServer())
        .delete(path + 'projectId')
        .set('Cookie', cookie)
        .expect(404)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Project'),
        );
    });
    it('Should fail Forbidden Exception, Not a Moderator or Admin', async () => {
      return req(app.getHttpServer())
        .delete(path + projectId)
        .set('Cookie', cookieOtherUser)
        .expect(403)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('unauthorized'),
        );
    });
    it('Should Messages Deleted by Moderator', () => {
      return req(app.getHttpServer())
        .delete(path + projectId)
        .set('Cookie', cookie)
        .expect(200);
    });
    it('Should Messages Deleted by Admin', () => {
      return req(app.getHttpServer())
        .delete(path + projectId)
        .set('Cookie', cookieAdmin)
        .expect(200);
    });
  });
});
