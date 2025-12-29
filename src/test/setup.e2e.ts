import {
  INestApplication,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import { Server } from 'http';
import { AppModule } from 'src/app.module';
import { AuthEmailMock } from 'src/auth/mock/auth.email.mock';
import { EmailService } from 'src/email/email.service';
import { MessageGateway } from 'src/message/message.gateway';
import { messageGatewayMock } from 'src/message/mock/message.gateway.mock';
import { notificationGatewayMock } from 'src/notification/mock/notification.gateway.mock';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { postGatewayMock } from 'src/post/mock/post.gateway.mock';
import { PostGateway } from 'src/post/post.gateway';
import { PrismaService } from 'src/prisma/prisma.service';
import { projectGatewayMock } from 'src/project/mock/project.gateway.mock';
import { ProjectGateway } from 'src/project/project.gateway';
import * as request from 'supertest';
export let app: INestApplication<Server>;
export let prisma: PrismaService;
export let cookie: string;
export let cookieAdmin: string;
export let cookieOtherUser: string;
beforeAll(async () => {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(EmailService)
    .useValue(AuthEmailMock)
    .overrideProvider(MessageGateway)
    .useValue(messageGatewayMock)
    .overrideProvider(ProjectGateway)
    .useValue(projectGatewayMock)
    .overrideProvider(NotificationGateway)
    .useValue(notificationGatewayMock)
    .overrideProvider(PostGateway)
    .useValue(postGatewayMock)
    .compile();
  app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.use(cookieParser());
  prisma = app.get(PrismaService);
  await app.init();
  const resCookie = await request(app.getHttpServer())
    .post('/auth/signin')
    .send({ identifier: 'email2@email.com', password: 'StrongP@ssword73' })
    .expect(201);
  const resCookieAdmin = await request(app.getHttpServer())
    .post('/auth/signin')
    .send({ identifier: 'posteMan', password: 'StrongP@ssword73' })
    .expect(201);
  const resCookieOtherUser = await request(app.getHttpServer())
    .post('/auth/signin')
    .send({ identifier: 'user3', password: 'StrongP@ssword73' })
    .expect(201);
  if (resCookie && resCookieAdmin && resCookieOtherUser) {
    cookie = resCookie.headers['set-cookie'];
    cookieAdmin = resCookieAdmin.headers['set-cookie'];
    cookieOtherUser = resCookieOtherUser.headers['set-cookie'];
  }
});

afterAll(async () => {
  await app.close();
});
export async function getLink(name: string) {
  const existingLink = await prisma.link_Project.findFirst({
    where: { numberUsage: { gt: 0 }, projet: { name } },
    select: { id: true },
  });
  if (!existingLink) {
    throw new NotFoundException('Link not found');
  }
  return existingLink.id;
}

export async function getProject(name: string) {
  const existingProject = await prisma.project.findFirst({
    where: { name },
    select: { id: true },
  });
  if (!existingProject) {
    throw new NotFoundException('Project not found');
  }

  return existingProject.id;
}
