import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import { Server } from 'http';
import { AuthModule } from 'src/auth/auth.module';
import { AuthEmailMock } from 'src/auth/mock/auth.email.mock';
import { AuthPrismaMock } from 'src/auth/mock/auth.prisma.mock';
import { EmailService } from 'src/email/email.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { resMessageType } from 'src/utils/type';
import * as request from 'supertest';
const signupDTO = {
  firstName: 'firstName',
  lastName: 'lastName',
  email: 'email@email.com',
  username: 'username',
  password: 'strongP@ssword73',
};

describe('AuthController (e2e)', () => {
  let app: INestApplication<Server>;
  let prisma: PrismaService;
  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(EmailService)
      .useValue(AuthEmailMock)
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.use(cookieParser());
    prisma = app.get(PrismaService);
    await app.init();
  });
  afterAll(async () => {
    await prisma.user.delete({
      where: { username: 'username' },
    });

    await app.close();
  });
  describe('/ (POST) Signup', () => {
    it('Signup successfully', async () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send(signupDTO)
        .expect(201)
        .then((res: resMessageType) => {
          expect(res.body.message).toEqual('Your account as been create !');
        });
    });
    it('Should return an Unauthorized Exception, Username already taken', async () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send(signupDTO)
        .expect(401)
        .then((res: resMessageType) => {
          expect(res.body.message).toEqual('Username already taken 😱');
        });
    });
    it('Should return an Unauthorized Exception, Email already taken', async () => {
      const newDTO = { ...signupDTO, username: 'otherUsername' };
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send(newDTO)
        .expect(401)
        .then((res: resMessageType) => {
          expect(res.body.message).toEqual('Email already taken 😱');
        });
    });
    it('Should return a Bad Request Exception, firstName', async () => {
      const newDTO = { ...signupDTO, firstName: '' };
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send(newDTO)
        .expect(400)
        .then((res: resMessageType) => {
          expect(res.body.message[0]).toContain('firstName');
        });
    });
    it('Should return a Bad Request Exception, lastName', async () => {
      const newDTO = { ...signupDTO, lastName: '' };
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send(newDTO)
        .expect(400)
        .then((res: resMessageType) => {
          expect(res.body.message[0]).toContain('lastName');
        });
    });
    it('Should return a Bad Request Exception, email', async () => {
      const newDTO = { ...signupDTO, email: '' };
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send(newDTO)
        .expect(400)
        .then((res: resMessageType) => {
          expect(res.body.message[0]).toContain('email');
        });
    });
    it('Should return a Bad Request Exception, username', async () => {
      const newDTO = { ...signupDTO, username: '' };
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send(newDTO)
        .expect(400)
        .then((res: resMessageType) => {
          expect(res.body.message[0]).toContain('username');
        });
    });
    it('Should return a Bad Request Exception, password', async () => {
      const newDTO = { ...signupDTO, password: '' };
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send(newDTO)
        .expect(400)
        .then((res: resMessageType) => {
          expect(res.body.message[0]).toContain('password');
        });
    });
  });
  describe('/ (PATCH) activationAccount', () => {
    it('Should fail Not Found Exception, Account not found', async () => {
      return request(app.getHttpServer())
        .patch('/auth/activationAccount/token')
        .expect(404)
        .then((res: resMessageType) => {
          expect(res.body.message).toEqual('Account not found');
        });
    });
    it('Should active account', async () => {
      const token = await prisma.user.findUnique({
        where: { username: 'username' },
        select: { activateToken: true },
      });
      if (token) {
        return request(app.getHttpServer())
          .patch(`/auth/activationAccount/${token.activateToken}`)
          .expect(200);
      }
    });
  });
  describe('/ (POST) signin', () => {
    const signinDTO = { identifier: 'username', password: 'strongP@ssword73' };
    it('Shoud return a message and a name role', async () => {
      return request(app.getHttpServer())
        .post('/auth/signin')
        .send(signinDTO)
        .expect(201);
    });
    it('Shoud fail Unauthorized Exception, invalid identifier', async () => {
      const newDTO = { ...signinDTO, identifier: 'otherUsername' };
      return request(app.getHttpServer())
        .post('/auth/signin')
        .send(newDTO)
        .expect(401)
        .then((res: { body: { message: string } }) => {
          expect(res.body.message).toEqual('Invalid credential');
        });
    });
    it('Shoud fail Unauthorized Exception, invalid Password', async () => {
      const newDTO = { ...signinDTO, password: 'otherStrongP@ssword73' };
      return request(app.getHttpServer())
        .post('/auth/signin')
        .send(newDTO)
        .expect(401)
        .then((res: { body: { message: string } }) => {
          expect(res.body.message).toEqual('Invalid credential');
        });
    });
    it('Shoud fail Unauthorized Exception, account is not active', async () => {
      await prisma.user.update({
        where: { username: 'username' },
        data: { isActive: false },
      });
      return request(app.getHttpServer())
        .post('/auth/signin')
        .send(signinDTO)
        .expect(401)
        .then((res: resMessageType) => {
          expect(res.body.message).toEqual('Your account is not activate');
        });
    });
    it('Should fail Bad Request Exception, identifier', async () => {
      const newDTO = { ...signinDTO, identifier: '' };
      return request(app.getHttpServer())
        .post('/auth/signin')
        .send(newDTO)
        .expect(400)
        .then((res: { body: { message: string } }) => {
          expect(res.body.message[0]).toContain('identifier');
        });
    });
    it('Should fail Bad Request Exception, password', async () => {
      const newDTO = { ...signinDTO, password: '' };
      return request(app.getHttpServer())
        .post('/auth/signin')
        .send(newDTO)
        .expect(400)
        .then((res: { body: { message: string } }) => {
          expect(res.body.message[0]).toContain('password');
        });
    });
  });
  describe('/ (POST) forgetpassword', () => {
    const path = '/auth/forgetPassword';
    const forgetPasswordDTO = { email: 'email@email.com' };
    it('Should fail send a mail', async () => {
      return request(app.getHttpServer())
        .post(path)
        .send(forgetPasswordDTO)
        .expect(403)
        .then((res: resMessageType) => {
          expect(res.body.message).toEqual('Your account is not activate');
        });
    });
    it('Should send a mail', async () => {
      await prisma.user.update({
        where: { email: forgetPasswordDTO.email },
        data: { isActive: true },
      });
      return request(app.getHttpServer())
        .post(path)
        .send(forgetPasswordDTO)
        .expect(201)
        .then((res: resMessageType) => {
          expect(res.body.message).toEqual('A mail was send.');
        });
    });
    it('Should send a mail', async () => {
      const newDTO = { email: '' };
      return request(app.getHttpServer())
        .post(path)
        .send(newDTO)
        .expect(400)
        .then((res: resMessageType) => {
          expect(res.body.message[0]).toContain('email');
        });
    });
  });
  describe('/ (POST) resetPassword', () => {
    const path = '/auth/resetPassword';
    const resetPasswordDTO = {
      password: 'strongP@ssword73',
    };
    let cookie: string;
    beforeAll(async () => {
      const resCookie = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({ identifier: 'username', password: 'strongP@ssword73' })
        .expect(201);
      cookie = resCookie.headers['set-cookie'];
    });
    it('Should send a mail', async () => {
      return request(app.getHttpServer())
        .post(path)
        .send(resetPasswordDTO)
        .set('Cookie', cookie)
        .expect(201)
        .then((res: resMessageType) => {
          expect(res.body.message).toEqual('Your password has been change');
        });
    });
    it('Should fail Bad Request Exception, password', async () => {
      return request(app.getHttpServer())
        .post(path)
        .set('Cookie', cookie)
        .expect(400)
        .then((res: resMessageType) => {
          expect(res.body.message[0]).toContain('password');
        });
    });
  });
  describe('/ (POST) logout', () => {
    const path = '/auth/logout';
    it('Should clear cookie', async () => {
      return request(app.getHttpServer())
        .post(path)
        .expect(201)
        .then((res: resMessageType) => {
          expect(res.body.message).toEqual('Deconnection Success');
        });
    });
  });
});

describe('AuthController Mock', () => {
  let app: INestApplication<Server>;
  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(PrismaService)
      .useValue(AuthPrismaMock)
      .overrideProvider(EmailService)
      .useValue(AuthEmailMock)
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });
  describe('/ (POST) Signup mock', () => {
    it('Should return an Unauthorized Exception, Username already taken', async () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send(signupDTO)
        .expect(500);
    });
  });
});
