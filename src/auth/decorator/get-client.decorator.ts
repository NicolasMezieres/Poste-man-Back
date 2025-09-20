import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from 'src/prisma/generated';
import { AuthenticatedSocket } from 'src/utils/interface';

export const getClient = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext): unknown => {
    const client = ctx.switchToWs().getClient<AuthenticatedSocket>();
    const user: User = client.user;
    return data ? user?.[data] : user;
  },
);
