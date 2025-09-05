import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAcademicDto } from './dto/create-academic.dto';
import { UpdateAcademicDto } from './dto/update-academic.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Academic } from './entities/academic.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AcademicService {

  constructor(
    @InjectRepository(Academic)
    private readonly repo: Repository<Academic>,
  ) { }

  async create(createAcademicDto: CreateAcademicDto) {
    const level = this.repo.create(createAcademicDto)
    return await this.repo.save(level)
  }

  async findAll() {
    return await this.repo.find();
  }

  findOne(id: number) {
    return `This action returns a #${id} academic`;
  }

  async update(id: string, updateAcademicDto: CreateAcademicDto) {
    const level = await this.repo.findOne({ where: { id } });
    if (!level) throw new NotFoundException('Nivel académico no encontrado');

    Object.assign(level, updateAcademicDto);
    return await this.repo.save(level);
  }

  async delete(id: string) {
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Nivel académico no encontrado');
    }
    return { message: 'Nivel académico eliminado con éxito' };
  }
}
