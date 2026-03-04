import * as request from 'supertest';
import {
  app,
  cookie,
  cookieAdmin,
  cookieOtherUser,
  getProject,
  prisma,
} from './setup.int';
import { resMessageType } from 'src/utils/type';
import { NotFoundException } from '@nestjs/common';
describe('Section (e2e)', () => {
  let projectId: string;
  beforeAll(async () => {
    await request(app.getHttpServer())
      .post('/project/create')
      .set('Cookie', cookie)
      .send({ name: 'sectionSpec' })
      .expect(201);
    projectId = await getProject('sectionSpec');
  });
  afterAll(async () => {
    await prisma.section.deleteMany({
      where: {
        project: { name: { contains: 'sectionSpec' } },
      },
    });
    await prisma.project.deleteMany({
      where: { name: { contains: 'sectionSpec' } },
    });
  });
  describe('/ (GET) Sections', () => {
    const path = '/section/project/';
    it('Should fail Need a Cookie', async () => {
      return request(app.getHttpServer())
        .get(path + 'projectId')
        .expect(401)
        .expect((res: resMessageType) =>
          expect(res.body.message).toContain('Unauthorized'),
        );
    });
    it('Should fail Not Found Exception, Project not found', async () => {
      return request(app.getHttpServer())
        .get(path + 'projectId')
        .set('Cookie', cookie)
        .expect(404)
        .expect((res: resMessageType) =>
          expect(res.body.message).toContain('Projet introuvable'),
        );
    });
    it('Should fail Forbidden Exception, Not member and admin', async () => {
      await request(app.getHttpServer())
        .post('/project/create')
        .set('Cookie', cookie)
        .send({ name: 'sectionSpecs' })
        .expect(201);
      return request(app.getHttpServer())
        .get(path + projectId)
        .set('Cookie', cookieOtherUser)
        .expect(403)
        .expect((res: resMessageType) =>
          expect(res.body.message).toContain('pas autorisé'),
        );
    });
    it('Should return Sections of project, Member', async () => {
      return request(app.getHttpServer())
        .get(path + `${projectId}`)
        .set('Cookie', cookie)
        .expect(200);
    });
    it('Should return Sections of project, Admin', async () => {
      return request(app.getHttpServer())
        .get(path + `${projectId}`)
        .set('Cookie', cookieAdmin)
        .expect(200);
    });
  });
  describe('/ (POST) Create Section', () => {
    const path = '/section/project/';
    it('Should fail Need a Cookie', async () => {
      return request(app.getHttpServer())
        .post(path + 'projectId/create')
        .expect(401)
        .expect((res: resMessageType) =>
          expect(res.body.message).toContain('Unauthorized'),
        );
    });
    it('Should fail Bad Request Exception, name', async () => {
      return request(app.getHttpServer())
        .post(path + 'projectId/create')
        .set('Cookie', cookie)
        .expect(400)
        .expect((res: resMessageType) =>
          expect(res.body.message[0]).toContain('name'),
        );
    });
    it('Should fail Not Found exception, Project not found', async () => {
      return request(app.getHttpServer())
        .post(path + 'projectId/create')
        .set('Cookie', cookie)
        .send({ name: 'sectionName' })
        .expect(404)
        .expect((res: resMessageType) =>
          expect(res.body.message).toContain('Projet'),
        );
    });
    it('Should Section Created', async () => {
      return request(app.getHttpServer())
        .post(path + projectId + '/create')
        .set('Cookie', cookie)
        .send({ name: 'sectionName' })
        .expect(201);
    });
    it('Should fail Bad Request Exception, name section already used', async () => {
      return request(app.getHttpServer())
        .post(path + projectId + '/create')
        .set('Cookie', cookie)
        .send({ name: 'sectionName' })
        .expect(400)
        .expect((res: resMessageType) =>
          expect(res.body.message).toEqual(
            'Ce nom de section est déjà utilisé',
          ),
        );
    });
  });
  describe('/ (PATCH) Update Section', () => {
    const sectionDTO = { name: 'section' };
    let sectionId: string;
    it('Should fail Need a Cookie', async () => {
      return request(app.getHttpServer())
        .patch('/section/sectionId/project/projectId')
        .expect(401)
        .expect((res: resMessageType) =>
          expect(res.body.message).toContain('Unauthorized'),
        );
    });
    it('Should fail Bad Request Exception, name', async () => {
      return request(app.getHttpServer())
        .patch('/section/sectionId/project/projectId')
        .expect(400)
        .set('Cookie', cookie)
        .expect((res: resMessageType) =>
          expect(res.body.message[0]).toContain('name'),
        );
    });
    it('Should fail Not Found Exception, Not found section', async () => {
      return request(app.getHttpServer())
        .patch('/section/sectionId/project/projectId')
        .expect(404)
        .set('Cookie', cookie)
        .send(sectionDTO)
        .expect((res: resMessageType) =>
          expect(res.body.message).toContain('Section introuvable'),
        );
    });
    it('Should fail Forbidden Exception, name already used', async () => {
      const section = await prisma.section.findFirst({
        where: { projectId },
        select: { id: true },
      });
      if (!section) {
        throw new NotFoundException('Section not found !');
      }
      sectionId = section.id;
      return request(app.getHttpServer())
        .patch(`/section/${sectionId}/project/${projectId}`)
        .expect(403)
        .set('Cookie', cookie)
        .send({ name: 'sectionName' })
        .expect((res: resMessageType) =>
          expect(res.body.message).toEqual(
            'Ce nom de section est déjà utilisé',
          ),
        );
    });
    it('Should Section Update', async () => {
      return request(app.getHttpServer())
        .patch(`/section/${sectionId}/project/${projectId}`)
        .expect(200)
        .set('Cookie', cookie)
        .send({ name: 'sectionSpec' })
        .expect((res: resMessageType) =>
          expect(res.body.message).toEqual('Section modifié'),
        );
    });
  });
  describe('/ (DELETE) Remove Section', () => {
    let path: string;
    let sectionId: string;
    it('Should fail Need a Cookie', async () => {
      return request(app.getHttpServer())
        .delete('/section/sectionId')
        .expect(401)
        .expect((res: resMessageType) =>
          expect(res.body.message).toContain('Unauthorized'),
        );
    });
    it('Should fail Forbidden Exception, Not a Moderator or an Admin', async () => {
      const section = await prisma.section.findFirst({
        where: { name: 'sectionSpec' },
        select: { id: true },
      });
      if (!section) {
        throw new NotFoundException('Section not found');
      }
      sectionId = section.id;
      path = `/section/${sectionId}`;
      return request(app.getHttpServer())
        .delete(path)
        .set('Cookie', cookieOtherUser)
        .expect(403)
        .expect((res: resMessageType) =>
          expect(res.body.message).toContain('pas autorisé'),
        );
    });
    it('Should Section deleted, Admin', async () => {
      await prisma.post.deleteMany({
        where: { sectionId },
      });
      return request(app.getHttpServer())
        .delete(path)
        .set('Cookie', cookieAdmin)
        .expect(200)
        .expect((res: resMessageType) =>
          expect(res.body.message).toContain('supprimé'),
        );
    });
    it('Should fail Not Found Exception, Section not found', async () => {
      return request(app.getHttpServer())
        .delete('/section/sectionId')
        .set('Cookie', cookie)
        .expect(404)
        .expect((res: resMessageType) =>
          expect(res.body.message).toContain('Section'),
        );
    });
    it('Should Section deleted, Moderator', async () => {
      await request(app.getHttpServer())
        .post('/section/project/' + projectId + '/create')
        .set('Cookie', cookie)
        .send({ name: 'newSection' })
        .expect(201);
      const section = await prisma.section.findFirst({
        where: { name: 'newSection' },
        select: { id: true },
      });
      if (!section) {
        throw new NotFoundException('Section not found');
      }
      return request(app.getHttpServer())
        .delete('/section/' + section.id)
        .set('Cookie', cookie)
        .expect(200)
        .expect((res: resMessageType) =>
          expect(res.body.message).toContain('supprimé'),
        );
    });
  });
  describe('/(DELETE) Remove All Section', () => {
    const path = '/section/';
    it('Should fail Unauthorized (401), need a cookie', async () => {
      await request(app.getHttpServer())
        .delete(path + 'project/projectId')
        .expect(401)
        .expect((res: resMessageType) =>
          expect(res.body.message).toContain('Unauthorized'),
        );
    });
    it('Should fail Not found Project (404)', async () => {
      await request(app.getHttpServer())
        .delete(path + 'project/projectId')
        .set('Cookie', cookie)
        .expect(404)
        .expect((res: resMessageType) =>
          expect(res.body.message).toContain('Projet introuvable'),
        );
    });
    it('Should fail user is not a Moderator or Admin', async () => {
      await request(app.getHttpServer())
        .delete(path + 'project/' + projectId)
        .set('Cookie', cookieOtherUser)
        .expect(403)
        .expect((res: resMessageType) =>
          expect(res.body.message).toContain('pas modérateur'),
        );
    });
    it('Should succes, delete all section by Moderator', async () => {
      await request(app.getHttpServer())
        .delete(path + 'project/' + projectId)
        .set('Cookie', cookie)
        .expect(200);
    });
    it('Should succes, delete all section by Admin', async () => {
      await request(app.getHttpServer())
        .delete(path + 'project/' + projectId)
        .set('Cookie', cookieAdmin)
        .expect(200);
    });
  });
});
