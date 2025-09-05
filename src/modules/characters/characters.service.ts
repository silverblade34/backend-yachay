import { Injectable } from '@nestjs/common';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Character } from './entities/character.entity';
import { Repository } from 'typeorm';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class CharactersService {


  constructor(
    @InjectRepository(Character)
    private characterRepo: Repository<Character>,
    private uploadService: UploadService,
  ) {}
 

  async create(dto: CreateCharacterDto, file: Express.Multer.File) {
    const imageUrl = await this.uploadService.uploadFile(file, 'characters', dto.name);

    const character = this.characterRepo.create({
      ...dto,
      imageUrl,
    });

    return await this.characterRepo.save(character);
  }

  findAll() {
    return this.characterRepo.find({})
  }


}
