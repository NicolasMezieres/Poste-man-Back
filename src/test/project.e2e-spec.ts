import * as request from 'supertest';
import {
  app,
  cookie,
  cookieAdmin,
  cookieOtherUser,
  getLink,
  getProject,
  prisma,
} from './setup.e2e';
import { resMessageType } from 'src/utils/type';
import { NotFoundException } from '@nestjs/common';
describe('Project (e2e) ', () => {
  let projectId: string;
  beforeAll(async () => {
    await request(app.getHttpServer())
      .post('/project/create')
      .set('Cookie', cookie)
      .send({ name: 'projectSpec' })
      .expect(201);
    projectId = await getProject('projectSpec');
  });
  afterAll(async () => {
    await prisma.project.deleteMany({
      where: { name: 'projectSpec' },
    });
  });
  describe('/ (POST) create', () => {
    const path = '/project/create';
    const projectDTO = { name: 'projectSpec' };
    it('Should fail need a cookie', async () => {
      return request(app.getHttpServer())
        .post(path)
        .expect(401)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Unauthorized'),
        );
    });
    it('Should fail Bad Request Exception, name', async () => {
      return request(app.getHttpServer())
        .post(path)
        .expect(400)
        .set('Cookie', cookie)
        .expect((err: resMessageType) =>
          expect(err.body.message[0]).toContain('name'),
        );
    });
    it('Should create a project', async () => {
      return request(app.getHttpServer())
        .post(path)
        .set('Cookie', cookie)
        .send(projectDTO)
        .expect(201);
    });
  });
  describe('/ (GET) search', () => {
    const path = '/project/search';
    it('Should return list of project', async () => {
      return request(app.getHttpServer())
        .get(path)
        .set('Cookie', cookie)
        .expect(200);
    });
    it('Should fail need a cookie', async () => {
      return request(app.getHttpServer())
        .get(path)
        .expect(401)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Unauthorized'),
        );
    });
  });
  describe('/ (GET) search by Admin', () => {
    const path = '/project/searchAdmin';
    it('Should return list of project', async () => {
      return request(app.getHttpServer())
        .get(path)
        .set('Cookie', cookieAdmin)
        .expect(200);
    });
    it('Should fail unauthorized, user not admin', async () => {
      return request(app.getHttpServer())
        .get(path)
        .set('Cookie', cookie)
        .expect(401)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('not authorized'),
        );
    });
    it('Should fail need a cookie', async () => {
      return request(app.getHttpServer())
        .get(path)
        .expect(401)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Unauthorized'),
        );
    });
  });
  describe('/ (POST) create Inviation Link', () => {
    const path = `/project/`;
    it('Should fail need a cookie', async () => {
      return request(app.getHttpServer())
        .post(path + 'projectId/link')
        .expect(401)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Unauthorized'),
        );
    });
    it('Should Create Invitaion Link', async () => {
      return request(app.getHttpServer())
        .post(path + `${projectId}/link`)
        .set('Cookie', cookie)
        .expect(201);
    });
    it('Should fail Project not found !', async () => {
      return request(app.getHttpServer())
        .post(path + 'projectId/link')
        .set('Cookie', cookie)
        .expect(404)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Project'),
        );
    });
  });
  describe('/ (POST) join Project', () => {
    const path = '/project/';
    it('Should fail need a cookie', async () => {
      return request(app.getHttpServer())
        .post(path + 'linkId/join')
        .expect(401)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Unauthorized'),
        );
    });
    it('Should fail Not Found Exception, Link invalid', async () => {
      return request(app.getHttpServer())
        .post(path + 'linkId/join')
        .set('Cookie', cookie)
        .expect(404)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Link invalid'),
        );
    });
    it('Should user join', async () => {
      const linkId = await getLink('projectSpec');
      return request(app.getHttpServer())
        .post(path + `${linkId}/join`)
        .set('Cookie', cookieAdmin)
        .expect(201)
        .expect((res: resMessageType) =>
          expect(res.body.message).toContain('Welcome'),
        );
    });
    it('Should fail Forbidden Exception, user already in the project', async () => {
      const linkId = await getLink('projectSpec');
      const projectId = await prisma.project.findFirst({
        where: { name: 'projectSpec' },
        select: { id: true },
      });
      if (!projectId) {
        throw new NotFoundException('Project not found');
      }
      const existingUserAdmin = await prisma.user.findUnique({
        where: { username: 'posteMan' },
        select: { id: true },
      });
      if (!existingUserAdmin) {
        throw new NotFoundException('User not found');
      }
      const didUserInProject = await prisma.user_Has_Project.findFirst({
        where: { projectId: projectId.id, userId: existingUserAdmin.id },
        select: { id: true },
      });
      if (!didUserInProject) {
        await request(app.getHttpServer())
          .post(path + `${linkId}/join`)
          .set('Cookie', cookieAdmin)
          .expect(201)
          .expect((res: resMessageType) =>
            expect(res.body.message).toContain('Welcome'),
          );
      }
      return request(app.getHttpServer())
        .post(path + `${linkId}/join`)
        .set('Cookie', cookieAdmin)
        .expect(403)
        .expect((res: resMessageType) =>
          expect(res.body.message).toEqual('You are already in the project !'),
        );
    });
    it('Should fail Forbidden Exception, Link expired !', async () => {
      const linkId = await getLink('projectSpec');
      await prisma.link_Project.update({
        where: { id: linkId },
        data: { outdatedAt: new Date(-1) },
      });
      return request(app.getHttpServer())
        .post(path + `${linkId}/join`)
        .set('Cookie', cookieAdmin)
        .expect(403)
        .expect((res: resMessageType) =>
          expect(res.body.message).toEqual('Link expired !'),
        );
    });
    it('Should fail Forbidden Exception, Link invalid ! Number usage equal 0', async () => {
      const linkId = await getLink('projectSpec');
      await prisma.link_Project.update({
        where: { id: linkId },
        data: { numberUsage: 0 },
      });
      return request(app.getHttpServer())
        .post(path + `${linkId}/join`)
        .set('Cookie', cookieAdmin)
        .expect(404)
        .expect((res: resMessageType) =>
          expect(res.body.message).toEqual('Link invalid !'),
        );
    });
  });
  describe('/ (PATCH) ban member', () => {
    const path = '/project/:projectId/user/:userId';

    it('Should fail need a cookie', async () => {
      return request(app.getHttpServer())
        .patch(path)
        .expect(401)
        .expect((err: resMessageType) => {
          expect(err.body.message).toContain('Unauthorized');
        });
    });
    it('Should fail Forbidden Exception, You are not moderator of this project', async () => {
      return request(app.getHttpServer())
        .patch(path)
        .expect(403)
        .set('Cookie', cookieAdmin)
        .expect((err: resMessageType) => {
          expect(err.body.message).toContain('unauthorized');
        });
    });
    it('Should fail Not Found Exception, Member to ban not found', async () => {
      return request(app.getHttpServer())
        .patch(`/project/${projectId}/user/userId`)
        .expect(404)
        .set('Cookie', cookie)
        .expect((err: resMessageType) => {
          expect(err.body.message).toEqual('Not found member !');
        });
    });
    it('Should fail Not Found Exception, Member to ban not found', async () => {
      const user = await prisma.user.findUnique({
        where: { username: 'posteMan' },
        select: { id: true },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return request(app.getHttpServer())
        .patch(`/project/${projectId}/user/${user.id}`)
        .expect(200)
        .set('Cookie', cookie)
        .expect((err: resMessageType) => {
          expect(err.body.message).toEqual('Ban status updated');
        });
    });
  });
  describe('/ (PATCH) rename project', () => {
    const path = '/project/projectId';
    const projectDTO = { name: 'newName' };
    it('Should fail Need a Cookie', async () => {
      return request(app.getHttpServer())
        .patch(path)
        .expect(401)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Unauthorized'),
        );
    });
    it('Should fail Bad Request Exception, name', async () => {
      return request(app.getHttpServer())
        .patch(path)
        .set('Cookie', cookieAdmin)
        .expect(400)
        .expect((err: resMessageType) =>
          expect(err.body.message[0]).toContain('name'),
        );
    });
    it('Should fail You are not moderator', async () => {
      return request(app.getHttpServer())
        .patch(`/project/${projectId}`)
        .set('Cookie', cookieAdmin)
        .send(projectDTO)
        .expect(404)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Project'),
        );
    });
    it('Should rename project', async () => {
      return request(app.getHttpServer())
        .patch(`/project/${projectId}`)
        .set('Cookie', cookie)
        .send(projectDTO)
        .expect(200);
    });
  });
  describe('/ (DELETE) kick User', () => {
    const path = '/project/projectId/user/userId';
    it('Should fail Need a Cookie', async () => {
      return request(app.getHttpServer())
        .delete(path)
        .expect(401)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Unauthorized'),
        );
    });
    it('Should fail Forbidden Exception', async () => {
      return request(app.getHttpServer())
        .delete(path)
        .expect(403)
        .set('Cookie', cookie)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('User not found'),
        );
    });
    it('Should kick user', async () => {
      const projectId = await prisma.project.findFirst({
        where: { name: 'newName' },
        select: { id: true },
      });
      const user = await prisma.user.findUnique({
        where: { username: 'posteMan' },
        select: { id: true },
      });
      return request(app.getHttpServer())
        .delete(`/project/${projectId?.id}/user/${user?.id}`)
        .expect(200)
        .set('Cookie', cookie)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('User kick'),
        );
    });
  });
  describe('/ (DELETE) remove project', () => {
    const path = '/project/';
    it('Should fail Need a Cookie', async () => {
      return request(app.getHttpServer())
        .delete(path + 'projectId')
        .expect(401)
        .expect((res: resMessageType) =>
          expect(res.body.message).toContain('Unauthorized'),
        );
    });
    it('Should fail Not Found Exception, Project not found', async () => {
      return request(app.getHttpServer())
        .delete(path + 'projectId')
        .set('Cookie', cookie)
        .expect(404)
        .expect((res: resMessageType) =>
          expect(res.body.message).toContain('Project'),
        );
    });
    it('Should fail Unauthorized Exception, is not a member and admin', async () => {
      return request(app.getHttpServer())
        .delete(path + projectId)
        .set('Cookie', cookieOtherUser)
        .expect(401)
        .expect((res: resMessageType) =>
          expect(res.body.message).toContain('unauthorized'),
        );
    });
    it('Should leave the project', async () => {
      const res: { body: { data: { id: string } } } = await request(
        app.getHttpServer(),
      )
        .post(path + `${projectId}/link`)
        .set('Cookie', cookie)
        .expect(201);

      await request(app.getHttpServer())
        .post(path + res.body.data.id + '/join')
        .set('Cookie', cookieOtherUser)
        .expect(201);

      return request(app.getHttpServer())
        .delete(path + projectId)
        .set('Cookie', cookieOtherUser)
        .expect(200)
        .expect((res: resMessageType) =>
          expect(res.body.message).toContain('leaved'),
        );
    });
    it('Should deleted project, Admin', async () => {
      return request(app.getHttpServer())
        .delete(path + projectId)
        .set('Cookie', cookieAdmin)
        .expect(200)
        .expect((res: resMessageType) =>
          expect(res.body.message).toContain('deleted'),
        );
    });
    it('Should deleted project, Moderator', async () => {
      await request(app.getHttpServer())
        .post('/project/create')
        .set('Cookie', cookie)
        .send({ name: 'truc' })
        .expect(201);
      const newProject = await prisma.project.findFirst({
        where: { name: 'truc' },
        select: { id: true },
      });
      if (!newProject) {
        throw new NotFoundException('New project not found');
      }
      return request(app.getHttpServer())
        .delete(path + newProject.id)
        .set('Cookie', cookie)
        .expect(200)
        .expect((res: resMessageType) =>
          expect(res.body.message).toContain('deleted'),
        );
    });
  });
});
