import { Controller, Get, Post, Body, UseInterceptors, UploadedFile, UseGuards } from '@nestjs/common';
import { CharactersService } from './characters.service';
import { CreateCharacterDto } from './dto/create-character.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('characters')
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) { }

  @Post('add')
  @UseInterceptors(FileInterceptor('image'))
  async createCharacter(
    @Body() dto: CreateCharacterDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.charactersService.create(dto, file);
  }

  @Get('all')
  findAll() {
    return this.charactersService.findAll();
  }


}
