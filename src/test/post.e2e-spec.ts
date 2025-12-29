import * as req from 'supertest';
import { app, cookie, cookieAdmin, cookieOtherUser, prisma } from './setup.e2e';
import { resMessageType } from 'src/utils/type';
import { NotFoundException } from '@nestjs/common';
describe('Post (e2e)', () => {
  let postId: string;
  let sectionId: string;
  let otherSectionId: string;
  let otherUserSectionId: string;
  let projectId: string;
  beforeAll(async () => {
    await req(app.getHttpServer())
      .post('/project/create')
      .set('Cookie', cookie)
      .send({ name: 'postSpec' })
      .expect(201);
    const project = await prisma.project.findFirst({
      where: { name: 'postSpec' },
      select: { id: true },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    projectId = project.id;
    await req(app.getHttpServer())
      .post('/project/create')
      .set('Cookie', cookieOtherUser)
      .send({ name: 'postSpecOther' })
      .expect(201);
    const existingProject = await prisma.project.findFirst({
      where: { name: 'postSpecOther' },
    });
    if (!existingProject) {
      throw new NotFoundException('Project not found');
    }
    await req(app.getHttpServer())
      .post('/section/project/' + existingProject.id + '/create')
      .set('Cookie', cookieOtherUser)
      .send({ name: 'postSpecUser' })
      .expect(201);
    const existingSectionOtherUser = await prisma.section.findFirst({
      where: { name: 'postSpecUser' },
      select: { id: true },
    });
    if (!existingSectionOtherUser) {
      throw new NotFoundException('Section not found');
    }
    otherUserSectionId = existingSectionOtherUser.id;
    await req(app.getHttpServer())
      .post('/section/project/' + projectId + '/create')
      .set('Cookie', cookie)
      .send({ name: 'postSpec' })
      .expect(201);
    await req(app.getHttpServer())
      .post('/section/project/' + projectId + '/create')
      .set('Cookie', cookie)
      .send({ name: 'postSpecOther' })
      .expect(201);
    const existingOtherSection = await prisma.section.findFirst({
      where: { name: 'postSpecOther' },
      select: { id: true },
    });
    if (!existingOtherSection) {
      throw new NotFoundException('Section not found');
    }
    otherSectionId = existingOtherSection.id;
  });
  afterAll(async () => {
    await prisma.post.deleteMany({
      where: { section: { project: { name: { contains: 'postSpec' } } } },
    });
    await prisma.section.deleteMany({
      where: { name: { contains: 'postSpec' } },
    });
    await prisma.project.deleteMany({
      where: { name: { contains: 'postSpec' } },
    });
  });
  describe('/ (GET) posts of section', () => {
    const path = '/post/section/';
    it('Should fail Need a Cookie', async () =>
      req(app.getHttpServer())
        .get(path + 'sectionId')
        .expect(401)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Unauthorized'),
        ));
    it('Should fail Not Found Exception', async () =>
      req(app.getHttpServer())
        .get(path + 'sectionId')
        .set('Cookie', cookie)
        .expect(404)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Section'),
        ));
    it('Should return Posts of Section', async () => {
      const existingSection = await prisma.section.findFirst({
        where: { name: 'postSpec' },
      });
      if (!existingSection) {
        throw new NotFoundException('Section not found !');
      }
      sectionId = existingSection.id;
      return req(app.getHttpServer())
        .get(path + sectionId)
        .set('Cookie', cookie)
        .expect(200);
    });
    it('Should Forbidden Exception, Not a Member or an Admin', async () => {
      const otherUser = await prisma.user.findUnique({
        where: { username: 'user3' },
        select: { id: true },
      });
      if (!otherUser) {
        throw new NotFoundException('User not found');
      }
      await prisma.user_Has_Project.deleteMany({
        where: { projectId: projectId, userId: otherUser.id },
      });
      return req(app.getHttpServer())
        .get(path + sectionId)
        .set('Cookie', cookieOtherUser)
        .expect(403)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('unauthorized'),
        );
    });
  });
  describe('/ (POST) Create Post', () => {
    const postDTO = { text: 'new post', poseX: 0, poseY: 0 };
    const path = '/post/section/';
    it('Should fail Need a Cookie', async () =>
      req(app.getHttpServer())
        .post(path + 'sectionId')
        .expect(401)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Unauthorized'),
        ));
    it('Should fail Bad Request Exception, text', async () =>
      req(app.getHttpServer())
        .post(path + 'sectionId')
        .set('Cookie', cookie)
        .expect(400)
        .expect((err: resMessageType) =>
          expect(err.body.message[0]).toContain('text'),
        ));
    it('Should fail Not Found Exception, Section not found', async () =>
      req(app.getHttpServer())
        .post(path + 'sectionId')
        .set('Cookie', cookie)
        .send(postDTO)
        .expect(404)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Section'),
        ));
    it('Should fail Forbidden Exception, Not a member', async () => {
      const existingOtherUser = await prisma.user.findUnique({
        where: { username: 'user3' },
        select: { id: true },
      });
      const existingUserInProject = await prisma.user_Has_Project.findFirst({
        where: { projectId: projectId, userId: existingOtherUser?.id },
        select: { id: true },
      });
      if (existingUserInProject) {
        await prisma.user_Has_Project.delete({
          where: { id: existingUserInProject.id },
        });
      }
      return req(app.getHttpServer())
        .post(path + sectionId)
        .set('Cookie', cookieOtherUser)
        .send(postDTO)
        .expect(403)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('unauthorized'),
        );
    });
    it('Should Create Post', async () => {
      if (!sectionId) {
        console.log(sectionId);
      }
      return req(app.getHttpServer())
        .post(path + sectionId)
        .set('Cookie', cookie)
        .send(postDTO)
        .expect(201);
    });
  });
  describe('/ (PATCH) Update Post', () => {
    const postDTO = { text: 'new post', poseX: 0, poseY: 0 };
    const path = '/post/';
    it('Should fail Need a Cookie', async () => {
      return req(app.getHttpServer())
        .patch(path + 'postId')
        .expect(401)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Unauthorized'),
        );
    });
    it('Should fail Bad Request Exception, text', async () => {
      return req(app.getHttpServer())
        .patch(path + 'postId')
        .set('Cookie', cookie)
        .expect(400)
        .expect((err: resMessageType) =>
          expect(err.body.message[0]).toContain('text'),
        );
    });
    it('Should fail Not Found Exception, Post not found', async () => {
      return req(app.getHttpServer())
        .patch(path + 'postId')
        .set('Cookie', cookie)
        .send(postDTO)
        .expect(404)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Post'),
        );
    });
    it('Should fail Forbidden Exception, Not Author', async () => {
      const post = await prisma.post.findFirst({
        where: { text: 'new post' },
        select: { id: true },
      });
      if (!post) {
        throw new NotFoundException('Post not found');
      }
      postId = post.id;
      return req(app.getHttpServer())
        .patch(path + postId)
        .set('Cookie', cookieAdmin)
        .send(postDTO)
        .expect(403)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('unauthorized'),
        );
    });
    it('Should Post Updated', async () => {
      return req(app.getHttpServer())
        .patch(path + postId)
        .set('Cookie', cookie)
        .send(postDTO)
        .expect(200);
    });
  });
  describe('/ (PATCH) Transfert Post ', () => {
    const path = '/post/postId/transfert/sectionId';
    it('Should fail Need a Cookie', async () => {
      return req(app.getHttpServer())
        .patch(path)
        .expect(401)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Unauthorized'),
        );
    });
    it('Should fail Not Found Exception, Post not found', async () => {
      return req(app.getHttpServer())
        .patch(path)
        .set('Cookie', cookie)
        .expect(404)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Post'),
        );
    });
    it('Should fail Bad Request Exception, Post already in section', async () => {
      return req(app.getHttpServer())
        .patch(`/post/${postId}/transfert/${sectionId}`)
        .set('Cookie', cookie)
        .expect(400)
        .expect((err: resMessageType) =>
          expect(err.body.message).toEqual('Post already in section'),
        );
    });
    it('Should fail Not Found Exception, Section not found', async () => {
      return req(app.getHttpServer())
        .patch(`/post/${postId}/transfert/sectionId`)
        .set('Cookie', cookie)
        .expect(404)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Section'),
        );
    });
    it('Should fail Forbidden Exception, Project is not in the same project of section', async () => {
      return req(app.getHttpServer())
        .patch(`/post/${postId}/transfert/${otherUserSectionId}`)
        .set('Cookie', cookie)
        .expect(403)
        .expect((err: resMessageType) =>
          expect(err.body.message).toEqual(
            'Project is not the same project of section',
          ),
        );
    });
    it('Should fail Forbidden Exception, Not Author of post, Moderator or Admin', async () => {
      return req(app.getHttpServer())
        .patch(`/post/${postId}/transfert/${otherSectionId}`)
        .set('Cookie', cookieOtherUser)
        .expect(403)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('not authorized'),
        );
    });
    it('Should Section of Post Changed', async () => {
      return req(app.getHttpServer())
        .patch(`/post/${postId}/transfert/${otherSectionId}`)
        .set('Cookie', cookie)
        .expect(200);
    });
  });
  describe('/ (PATCH) Move all Post of Section', () => {
    const path = '/post/section/';
    it('Should fail Need a Cookie', async () => {
      return req(app.getHttpServer())
        .patch(path + 'sectionId/transfert/moveSectionId')
        .expect(401)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Unauthorized'),
        );
    });
    it('Should Bad Request Exception, same sections', async () => {
      return req(app.getHttpServer())
        .patch(path + 'sectionId/transfert/sectionId')
        .set('Cookie', cookie)
        .expect(400)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('other section'),
        );
    });
    it('Should Not Found Exception, Section not found !', async () => {
      return req(app.getHttpServer())
        .patch(path + 'sectionId/move/otherSectionId')
        .set('Cookie', cookie)
        .expect(404)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Section'),
        );
    });
    it('Should Not Found Exception, Section to move not found !', async () => {
      return req(app.getHttpServer())
        .patch(path + `${sectionId}/transfert/sectionId`)
        .set('Cookie', cookie)
        .expect(404)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Section to move'),
        );
    });
    it('Should Forbidden Exception, Sections do not have the same Project', async () => {
      return req(app.getHttpServer())
        .patch(path + `${sectionId}/transfert/${otherUserSectionId}`)
        .set('Cookie', cookie)
        .expect(403)
        .expect((err: resMessageType) =>
          expect(err.body.message).toEqual(
            'Sections do not have the same project',
          ),
        );
    });
    it('Should ForbiddenException, Not a Moderator or Admin', async () => {
      return req(app.getHttpServer())
        .patch(path + `${sectionId}/transfert/${otherSectionId}`)
        .set('Cookie', cookieOtherUser)
        .expect(403)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('unauthorized'),
        );
    });
    it('Should Move all Post', async () => {
      return req(app.getHttpServer())
        .patch(path + `${sectionId}/transfert/${otherSectionId}`)
        .set('Cookie', cookie)
        .expect(200);
    });
  });
  describe('/ (PUT) Vote', () => {
    const voteDTO = { isUp: true };
    const path = `/post/postId/vote`;
    it('Should fail Need a Cookie', async () => {
      return req(app.getHttpServer())
        .put(path)
        .expect(401)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Unauthorized'),
        );
    });
    it('Should fail Bad Request Exception, isUp ', async () => {
      return req(app.getHttpServer())
        .put(path)
        .set('Cookie', cookie)
        .expect(400)
        .expect((err: resMessageType) =>
          expect(err.body.message[0]).toContain('isUp'),
        );
    });
    it('Should fail Not Found Exception, Post not found !', async () => {
      return req(app.getHttpServer())
        .put(path)
        .send(voteDTO)
        .set('Cookie', cookie)
        .expect(404)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Post'),
        );
    });
    it('Should fail Forbidden Exception, Not a member', async () => {
      return req(app.getHttpServer())
        .put(`/post/${postId}/vote`)
        .send(voteDTO)
        .set('Cookie', cookieOtherUser)
        .expect(403)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('unauthorized'),
        );
    });
    it('Should Voted !', async () => {
      return req(app.getHttpServer())
        .put(`/post/${postId}/vote`)
        .send(voteDTO)
        .set('Cookie', cookie)
        .expect(200);
    });
  });
  describe('/ (DELETE) Remove Post', () => {
    const path = '/post/postId';
    it('Should fail Need a Cookie', async () => {
      return req(app.getHttpServer())
        .delete(path)
        .expect(401)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Unauthorized'),
        );
    });
    it('Should fail Not Found Exception, Post not found !', async () => {
      return req(app.getHttpServer())
        .delete(path)
        .set('Cookie', cookie)
        .expect(404)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Post'),
        );
    });
    it('Should fail Forbidden Exception, Not Author, Moderator, Admin', async () => {
      return req(app.getHttpServer())
        .delete(`/post/${postId}`)
        .set('Cookie', cookieOtherUser)
        .expect(403)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('unauthorized'),
        );
    });
    it('Should Post Deleted', async () => {
      return req(app.getHttpServer())
        .delete(`/post/${postId}`)
        .set('Cookie', cookie)
        .expect(200);
    });
  });
  describe('/ (DELETE) Remove all Post of section', () => {
    const path = '/post/section/';
    it('Should fail Need a Cookie', async () => {
      return req(app.getHttpServer())
        .delete(path + 'sectionId')
        .expect(401)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Unauthorized'),
        );
    });
    it('Should fail Not Found Exception, Section not found', async () => {
      return req(app.getHttpServer())
        .delete(path + 'sectionId')
        .set('Cookie', cookie)
        .expect(404)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('Section'),
        );
    });
    it('Should fail Forbidden Exception, Not Moderator or Admin', async () => {
      return req(app.getHttpServer())
        .delete(path + sectionId)
        .set('Cookie', cookieOtherUser)
        .expect(403)
        .expect((err: resMessageType) =>
          expect(err.body.message).toContain('unauthorized'),
        );
    });
    it('Should Posts of Section Deleted', async () => {
      return req(app.getHttpServer())
        .delete(path + sectionId)
        .set('Cookie', cookie)
        .expect(200);
    });
  });
});
