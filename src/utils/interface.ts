import { Request } from 'express';
import { Socket } from 'socket.io';
import { User } from 'src/prisma/generated/client';

export interface RequestWithCookies extends Request {
  cookies: {
    access_token?: string;
    [key: string]: string | undefined;
  };
}

export interface AuthenticatedSocket extends Socket {
  user: User;
}
