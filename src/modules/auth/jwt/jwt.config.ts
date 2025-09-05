import { JwtModuleOptions } from '@nestjs/jwt';
import { jwtConstants } from './jwt.constants';

export const jwtConfig: JwtModuleOptions = {
  secret: jwtConstants.secret,
  signOptions: {
    expiresIn: jwtConstants.expiresIn,
  },
};
