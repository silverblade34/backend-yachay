import { ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService, JsonWebTokenError, TokenExpiredError } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { InvalidTokenException, MissingTokenException, TokenExpiredException } from 'src/common/http-exception/custom-exception';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new MissingTokenException();
    }

    if (info instanceof TokenExpiredError) {
      throw new TokenExpiredException();
    }
    
    if (info instanceof JsonWebTokenError) {
      throw new InvalidTokenException();
    }
    
    if (!user && !info) {
      throw new MissingTokenException();
    }
    
    if (err || !user) {
      throw new InvalidTokenException();
    }
    
    return user;
  }
}