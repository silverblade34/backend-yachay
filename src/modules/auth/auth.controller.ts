import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { FirebaseAuthDto } from './dto/firebase-auth.dto';
import * as fs from 'fs';
import * as path from 'path';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginAuthDto: LoginUserDto) {
    return this.authService.login(loginAuthDto);
  }

  @Post('prueba')
  async prueba(@Body() body: any) {
    const dirPath = path.join(process.cwd(), 'temp');
    const filePath = path.join(dirPath, 'body_prueba.json');

    try {
      // Crear directorio si no existe
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      await fs.promises.writeFile(filePath, JSON.stringify(body, null, 2), 'utf-8');
      return {
        message: 'Archivo guardado exitosamente',
        path: filePath
      };
    } catch (error) {
      return {
        error: 'Error al procesar',
        details: error.message
      };
    }
  }

  @HttpCode(HttpStatus.OK)
  @Post('firebase-login')
  async firebaseLogin(@Body() firebaseAuthDto: FirebaseAuthDto) {
    return this.authService.firebaseLogin(firebaseAuthDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('check-profile')
  async checkProfile(@Body() firebaseAuthDto: FirebaseAuthDto) {
    return this.authService.checkUserProfile(firebaseAuthDto);
  }
}
