import * as request from 'supertest';
import {
  app,
  cookie,
  cookieAdmin,
  cookieOtherUser,
  getLink,
  getProject,
  prisma,
} from './setup.int';
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
    await prisma.link_Project.deleteMany({
      where: { projet: { name: { contains: 'projectSpec' } } },
    });
    await prisma.project.deleteMany({
      where: { name: { contains: 'projectSpec' } },
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
  describe('/(GET) get Project', () => {
    const path = '/project/';
    it('Should fail need a cookie', async () => {
      return request(app.getHttpServer())
        .get(path + 'id')
        .expect(401)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Unauthorized'),
        );
    });
    it('Should fail Not Found Project', async () => {
      return request(app.getHttpServer())
        .get(path + 'notFoundId')
        .expect(404)
        .set('Cookie', cookieAdmin)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Projet introuvable'),
        );
    });
    it('Should fail Not a member of project and not admin', async () => {
      return request(app.getHttpServer())
        .get(path + projectId)
        .expect(403)
        .set('Cookie', cookieOtherUser)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain(
            'Vous ne faites pas partie de ce projet',
          ),
        );
    });
    it('Should get name of project, isModerator, isAdmin', async () => {
      return request(app.getHttpServer())
        .get(path + projectId)
        .expect(200)
        .set('Cookie', cookie);
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
          expect(err.body.message).toContain('Projet'),
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
          expect(err.body.message).toContain('Lien invalide'),
        );
    });
    it('Should user join', async () => {
      const linkId = await getLink('projectSpec');
      return request(app.getHttpServer())
        .post(path + `${linkId}/join`)
        .set('Cookie', cookieAdmin)
        .expect(201)
        .expect((res: resMessageType) =>
          expect(res.body.message).toContain('Bienvenue'),
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
          expect(res.body.message).toEqual('Vous êtes déjà dans le projet !'),
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
          expect(res.body.message).toEqual('Lien expiré !'),
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
          expect(res.body.message).toEqual('Lien invalide !'),
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
          expect(err.body.message).toContain('autorisé');
        });
    });
    it('Should fail Not Found Exception, Member to ban not found', async () => {
      return request(app.getHttpServer())
        .patch(`/project/${projectId}/user/userId`)
        .expect(404)
        .set('Cookie', cookie)
        .expect((err: resMessageType) => {
          expect(err.body.message).toEqual('Membre introuvable !');
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
          expect(err.body.message).toEqual('Status mis à jour !');
        });
    });
  });
  describe('/ (PATCH) rename project', () => {
    const path = '/project/projectId';
    const projectDTO = { name: 'projectSpec2' };
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
          expect(err.body.message).toContain('Projet'),
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
          expect(err.body.message).toContain('Utilisateur introuvable'),
        );
    });
    it('Should kick user', async () => {
      const projectId = await prisma.project.findFirst({
        where: { name: 'projectSpec2' },
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
          expect(err.body.message).toContain('exclu'),
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
          expect(res.body.message).toContain('Projet'),
        );
    });
    it('Should fail Unauthorized Exception, is not a member and admin', async () => {
      return request(app.getHttpServer())
        .delete(path + projectId)
        .set('Cookie', cookieOtherUser)
        .expect(403)
        .expect((res: resMessageType) =>
          expect(res.body.message).toContain('autorisé'),
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
          expect(res.body.message).toContain('quitté'),
        );
    });
    it('Should deleted project, Admin', async () => {
      return request(app.getHttpServer())
        .delete(path + projectId)
        .set('Cookie', cookieAdmin)
        .expect(200)
        .expect((res: resMessageType) =>
          expect(res.body.message).toContain('supprimé'),
        );
    });
    it('Should deleted project, Moderator', async () => {
      await request(app.getHttpServer())
        .post('/project/create')
        .set('Cookie', cookie)
        .send({ name: 'projectSpec2' })
        .expect(201);
      const newProject = await prisma.project.findFirst({
        where: { name: 'projectSpec2' },
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
          expect(res.body.message).toContain('supprimé'),
        );
    });
  });
  describe('/ (GET) Get Detail project', () => {
    const path = '/project/projectId/detail';
    it('Should fail, need an admin cookie', async () => {
      return request(app.getHttpServer())
        .get(path)
        .set('Cookie', cookie)
        .expect(401);
    });
    it('Should fail, project not found', async () => {
      return request(app.getHttpServer())
        .get(path)
        .set('Cookie', cookieAdmin)
        .expect(404);
    });
    it('Should succes', async () => {
      return request(app.getHttpServer())
        .get(`/project/${projectId}/detail`)
        .set('Cookie', cookieAdmin)
        .expect(200);
    });
  });
  describe('/ (GET) Get List Member', () => {
    const path = '/project/projectId/listMember';
    it('Should fail, need an admin cookie', async () => {
      return request(app.getHttpServer())
        .get(path)
        .set('Cookie', cookie)
        .expect(401);
    });
    it('Should fail, project not found', async () => {
      return request(app.getHttpServer())
        .get(path)
        .set('Cookie', cookieAdmin)
        .expect(404);
    });
    it('Should succes', async () => {
      return request(app.getHttpServer())
        .get(`/project/${projectId}/listMember`)
        .set('Cookie', cookieAdmin)
        .expect(200);
    });
  });
  describe('/ (GET) Get Project List By User', () => {
    const path = '/project/projectListByUser/userId';
    it('Should fail, need an admin cookie', async () => {
      return request(app.getHttpServer())
        .get(path)
        .set('Cookie', cookie)
        .expect(401);
    });
    it('Should fail, user not found', async () => {
      return request(app.getHttpServer())
        .get(path)
        .set('Cookie', cookieAdmin)
        .expect(404);
    });
    it('Should succes', async () => {
      const existingUser = await prisma.user.findFirst({
        where: { email: 'email2@email.com' },
        select: { id: true },
      });
      if (!existingUser) {
        throw new NotFoundException('user not found');
      }
      return request(app.getHttpServer())
        .get(`/project/projectListByUser/${existingUser.id}`)
        .set('Cookie', cookieAdmin)
        .expect(200);
    });
  });
});
