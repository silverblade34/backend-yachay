import { Module } from '@nestjs/common';
import { CharactersService } from './characters.service';
import { CharactersController } from './characters.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Character } from './entities/character.entity';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports : [
    TypeOrmModule.forFeature([Character])  , UploadModule
  ],
  controllers: [CharactersController],
  providers: [CharactersService],
})
export class CharactersModule {} 
