import { Controller, Get, Post, Body, Patch, Param, Delete, Query, BadRequestException, UseGuards } from '@nestjs/common';
import { CareersService } from './careers.service';
import { CreateCareerDto } from './dto/create-career.dto';
import { UpdateCareerDto } from './dto/update-career.dto';
import { CreateManyCareersDto } from './dto/create-many-careers.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import * as fs from 'fs';
import * as path from 'path';

@UseGuards(JwtAuthGuard)
@Controller('careers')
export class CareersController {
  constructor(private readonly careersService: CareersService) { }

  @Post('add-many')
  createBulk(@Body() createManyCareersDto: CreateManyCareersDto) {
    return this.careersService.bulkCreate(createManyCareersDto);
  }

  @Post('add')
  create(@Body() createCareerDto: CreateCareerDto) {
    return this.careersService.create(createCareerDto);
  }

  @Post('prueba')
  prueba(@Body() body: any) {
    const filePath = path.join(__dirname, '..', 'body_prueba.json');

    fs.writeFileSync(filePath, JSON.stringify(body, null, 2), 'utf-8');

    return { message: 'Body guardado en body_prueba.json' };
  }

  @Get('all-by-academic')
  findByAcademic(@Query('academicId') academicId: string) {
    if (!academicId) {
      throw new BadRequestException('academicId es requerido');
    }
    return this.careersService.findByAcademic(academicId);
  }

  @Get('all')
  findAll() {
    return this.careersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.careersService.findOne(id);
  }

  @Patch('update/:id')
  update(@Param('id') id: string, @Body() updateCareerDto: UpdateCareerDto) {
    return this.careersService.update(id, updateCareerDto);
  }

  @Delete('delete/:id')
  remove(@Param('id') id: string) {
    return this.careersService.remove(id);
  }
}
