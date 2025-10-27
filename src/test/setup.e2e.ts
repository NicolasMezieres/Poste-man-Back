import { INestApplication, ValidationPipe } from '@nestjs/common';
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
import { PrismaService } from 'src/prisma/prisma.service';
import { projectGatewayMock } from 'src/project/mock/project.gateway.mock';
import { ProjectGateway } from 'src/project/project.gateway';
import * as request from 'supertest';
export let app: INestApplication<Server>;
export let prisma: PrismaService;
export let cookie: string;
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
  if (resCookie) {
    cookie = resCookie.headers['set-cookie'];
  }
});

afterAll(async () => {
  await app.close();
});
