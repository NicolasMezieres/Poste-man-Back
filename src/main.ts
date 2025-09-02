import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  // app.enableCors({
  //   origin: [
  //     'https://lost-web-nicolasmezieres-nicolas-projects-d55648f9.vercel.app',
  //     'http://localhost:4200',
  //   ],
  //   credentials: true,
  // });
  app.use(cookieParser());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => console.log(err));
