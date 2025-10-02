import { HttpException, HttpStatus } from '@nestjs/common';

export class TokenExpiredException extends HttpException {
  constructor() {
    super('El token de acceso ha expirado', HttpStatus.UNAUTHORIZED);
  }
}

export class InvalidTokenException extends HttpException {
  constructor() {
    super('El token de acceso es inválido', HttpStatus.UNAUTHORIZED);
  }
}

export class MissingTokenException extends HttpException {
  constructor() {
    super('No se proporcionó token de acceso', HttpStatus.UNAUTHORIZED);
  }
}

export class InsufficientPermissionsException extends HttpException {
  constructor(requiredRole: string) {
    super(
      `No tienes permisos suficientes. Se requiere el rol: ${requiredRole}`,
      HttpStatus.FORBIDDEN,
    );
  }
}

export class InvalidUserException extends HttpException {
  constructor() {
    super('Usuario no encontrado o inactivo', HttpStatus.UNAUTHORIZED);
  }
}
