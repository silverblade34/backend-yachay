import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { LoginUserDto } from './dto/login-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserProfile } from '../user/entities/user-profile';
import { UserAvatar } from '../user/entities/user-avatar.entity';
import { FirebaseAuthDto } from './dto/firebase-auth.dto';
import { FirebaseService } from './firebase.service';
import { CheckVersionDto } from './dto/check-version.dto';
import { AppVersion } from './entities/app-version.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    @InjectRepository(UserProfile)
    private readonly profileRepo: Repository<UserProfile>,
    @InjectRepository(UserAvatar)
    private readonly avatarRepo: Repository<UserAvatar>,
    @InjectRepository(AppVersion)
    private readonly appVersionRepo: Repository<AppVersion>,
    private readonly firebaseService: FirebaseService,
  ) { }

  async login(dto: LoginUserDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password!);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return await this.generateUserResponse(user);
  }

  async checkAppVersion(checkVersionDto: CheckVersionDto) {
    const { version, platform } = checkVersionDto;

    const versionConfig = await this.appVersionRepo.findOne({
      where: { platform: platform.toLowerCase() },
    });

    if (!versionConfig) {
      throw new BadRequestException('Platform not supported');
    }

    const currentVersion = this.parseVersion(version);
    const minVersion = this.parseVersion(versionConfig.minVersion);
    const latestVersion = this.parseVersion(versionConfig.latestVersion);

    const needsUpdate = this.compareVersions(currentVersion, latestVersion) < 0;
    const isForceUpdate = this.compareVersions(currentVersion, minVersion) < 0;

    return {
      currentVersion: version,
      latestVersion: versionConfig.latestVersion,
      minVersion: versionConfig.minVersion,
      needsUpdate,
      forceUpdate: isForceUpdate || versionConfig.forceUpdate,
      updateUrl: versionConfig.updateUrl,
      releaseNotes: versionConfig.releaseNotes,
      canContinue: !isForceUpdate && !versionConfig.forceUpdate,
    };
  }

  // Comparar versiones: retorna -1 si v1 < v2, 0 si son iguales, 1 si v1 > v2
  private compareVersions(v1: number[], v2: number[]): number {
    for (let i = 0; i < 3; i++) {
      if (v1[i] < v2[i]) return -1;
      if (v1[i] > v2[i]) return 1;
    }
    return 0;
  }

  // Convertir "1.0.0" a [1, 0, 0]
  private parseVersion(version: string): number[] {
    return version.split('.').map((v) => parseInt(v, 10));
  }

  async firebaseLogin(dto: FirebaseAuthDto) {
    try {
      // Verificar token de Firebase
      const decodedToken = await this.firebaseService.verifyIdToken(dto.firebase_token);

      let user = await this.userRepo.findOne({
        where: { firebaseUid: decodedToken.uid }
      });

      if (!user) {
        user = await this.createUserFromFirebase(decodedToken);
      }

      return await this.generateUserResponse(user);
    } catch (error) {
      throw new UnauthorizedException('Error de autenticación con Firebase');
    }
  }

  async checkUserProfile(dto: FirebaseAuthDto) {
    try {
      // Verificar token de Firebase
      const decodedToken = await this.firebaseService.verifyIdToken(dto.firebase_token);

      let user = await this.userRepo.findOne({
        where: { firebaseUid: decodedToken.uid }
      });

      if (!user) {
        user = await this.createUserFromFirebase(decodedToken);
      }

      return await this.generateUserResponse(user);
    } catch (error) {
      throw new UnauthorizedException('Error al verificar el perfil');
    }
  }

  // MÉTODO HELPER: Crear usuario desde Firebase
  private async createUserFromFirebase(decodedToken: any): Promise<User> {
    try {
      const firebaseUser = await this.firebaseService.getUserByUid(decodedToken.uid);

      const newUser = this.userRepo.create({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email || firebaseUser.email,
        provider: this.getProviderFromToken(decodedToken),
        isConfigured: false,
        hasAvatar: false,
        isActive: true,
      });

      return await this.userRepo.save(newUser);
    } catch (error) {
      throw new InternalServerErrorException('Error al crear usuario desde Firebase');
    }
  }

  // MÉTODO HELPER: Determinar proveedor
  private getProviderFromToken(decodedToken: any): string {
    if (decodedToken.firebase?.sign_in_provider) {
      return decodedToken.firebase.sign_in_provider;
    }
    return 'firebase';
  }

  // MÉTODO HELPER: Generar respuesta común
  private async generateUserResponse(user: User) {
    let profile: UserProfile | null = null;
    if (user.isConfigured) {
      profile = await this.profileRepo.findOne({
        where: { user: { id: user.id } },
      });
    }

    let avatarUrl: string | null = null;
    if (user.hasAvatar) {
      const avatar = await this.avatarRepo.findOne({
        where: { user: { id: user.id } },
      });
      avatarUrl = avatar?.imageUrl || null;
    }

    const payload = {
      sub: user.id,
      email: user.email,
      firebaseUid: user.firebaseUid || null
    };
    const token = await this.jwtService.signAsync(payload);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firebaseUid: user.firebaseUid || null,
        provider: user.provider || null,
        isConfigured: user.isConfigured,
        hasAvatar: user.hasAvatar,
        avatar: avatarUrl,
        profile: profile || null,
      },
    };
  }
}