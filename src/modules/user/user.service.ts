import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { RegisterUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { UserProfile } from './entities/user-profile';
import { ProfileSettingsDto } from './dto/profile-settings.dto';
import { Academic } from '../academic/entities/academic.entity';
import { Career } from '../careers/entities/career.entity';
import { UserAvatar } from './entities/user-avatar.entity';
import { UploadService } from '../upload/upload.service';
import { Preference } from '../preferences/entities/preference.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(UserProfile)
    private profileRepo: Repository<UserProfile>,
    @InjectRepository(Preference)
    private preferenceRepo: Repository<Preference>,
    @InjectRepository(Academic)
    private academicLevelRepo: Repository<Academic>,
    @InjectRepository(Career)
    private careerRepo: Repository<Career>,
    @InjectRepository(UserAvatar)
    private avatarRepo: Repository<UserAvatar>,
    private readonly uploadService: UploadService,
  ) { }

  create(createUserDto: RegisterUserDto) {
    return 'This action adds a new user';
  }

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }


  async register(createUserDto: RegisterUserDto) {
    const existing = await this.userRepo.findOne({ where: { email: createUserDto.email } });
    if (existing) throw new ConflictException('El correo ya está en uso');

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepo.create({
      email: createUserDto.email,
      password: hashedPassword,
    });

    return await this.userRepo.save(user);

  }

  async findProfileSettings(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    let userProfile = await this.profileRepo.findOne({
      where: { user: { id: userId } },
      relations: ['preferences']
    });
    return userProfile;
  }

  async findGeneralInformation(userId: string) {
    let [userProfile, userAvatar] = await Promise.all([this.profileRepo.findOne({
      where: { user: { id: userId } },
      relations: ['preferences']
    }),
    this.avatarRepo.findOne({
      where: { user: { id: userId } }
    })]);
    return { userProfile, userAvatar };
  }

  async updateProfileSettings(userId: string, dto: ProfileSettingsDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const academic = await this.academicLevelRepo.findOne({
      where: { id: dto.academicLevelId },
    });

    if (!academic) {
      throw new NotFoundException('Nivel academico no encontrado');
    }

    let career: Career | null = null;
    if (dto.careerId) {
      career = await this.careerRepo.findOne({
        where: { id: dto.careerId },
      });

      if (!career) {
        throw new NotFoundException('Carrera no encontrada');
      }
    }

    let userProfile = await this.profileRepo.findOne({
      where: { user: { id: userId } },
      relations: ['preferences']
    });

    // Si no existe el perfil, crear uno nuevo
    if (!userProfile) {
      userProfile = new UserProfile();
      userProfile.user = user;
    }

    // Actualizar los campos del perfil (tanto para crear como para editar)
    userProfile.firstName = dto.firstName;
    userProfile.lastName = dto.lastName;
    userProfile.gender = dto.gender;
    userProfile.birthDate = dto.birthDate;
    userProfile.academicLevelId = dto.academicLevelId;
    userProfile.careerId = dto.careerId;

    // Manejar las preferencias
    if (dto.preferenceIds?.length) {
      const preferences = await this.preferenceRepo.findByIds(dto.preferenceIds);
      if (preferences.length !== dto.preferenceIds.length) {
        throw new NotFoundException('Una o más preferencias no fueron encontradas');
      }
      userProfile.preferences = preferences;
    } else {
      userProfile.preferences = [];
    }

    await this.profileRepo.save(userProfile);

    user.isConfigured = true;
    await this.userRepo.save(user);

    return {
      message: userProfile.id ?
        'El perfil del usuario ha sido actualizado correctamente' :
        'El usuario ha configurado su perfil correctamente'
    };
  }

  async uploadAvatar(userId: string, file: Express.Multer.File | undefined, avatarUrl?: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    let imageUrl: string = avatarUrl ? avatarUrl : "";
    if (file != null) {
      imageUrl = await this.uploadService.uploadFile(file, 'avatar', userId);
    }

    let avatar = await this.avatarRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (avatar) {
      avatar.imageUrl = imageUrl;
    } else {
      avatar = this.avatarRepo.create({ user, imageUrl });
    }

    await this.avatarRepo.save(avatar);

    user.hasAvatar = true;
    await this.userRepo.save(user);

    return { imageUrl };
  }

  private extractFileName(url: string): string {
    return url.split('/').slice(-2).join('/');
  }
}
