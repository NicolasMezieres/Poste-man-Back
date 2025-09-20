import { AuthGuard } from '@nestjs/passport';

export class WsJwtGuard extends AuthGuard('wsJwt') {
  constructor() {
    super();
  }
}
