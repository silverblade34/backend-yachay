import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCareerDto } from './dto/create-career.dto';
import { UpdateCareerDto } from './dto/update-career.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Career } from './entities/career.entity';
import { Repository } from 'typeorm';
import { Academic } from 'src/modules/academic/entities/academic.entity';
import { CreateManyCareersDto } from './dto/create-many-careers.dto';

@Injectable()
export class CareersService {
  constructor(
    @InjectRepository(Career)
    private readonly careerRepo: Repository<Career>,

    @InjectRepository(Academic)
    private readonly academicRepo: Repository<Academic>,
  ) { }

  async bulkCreate(createManyCareersDto: CreateManyCareersDto) {
    const { academicId, careers } = createManyCareersDto;

    const academic = await this.academicRepo.findOne({ where: { id: academicId } });
    if (!academic) throw new NotFoundException('Nivel académico no encontrado');

    const careerEntities = careers.map(c => this.careerRepo.create({
      name: c.name,
      academic,
      academicId,
    }));

    return await this.careerRepo.save(careerEntities);
  }

  async create(createCareerDto: CreateCareerDto) {
    const { name, academicId } = createCareerDto;

    const academic = await this.academicRepo.findOne({ where: { id: academicId } });
    if (!academic) throw new NotFoundException('Nivel académico no encontrado');

    const career = this.careerRepo.create({
      name,
      academic,
      academicId,
    });

    return await this.careerRepo.save(career);
  }

  async findByAcademic(academicId: string) {
    const academic = await this.academicRepo.findOne({ where: { id: academicId } });
    if (!academic) throw new NotFoundException('Nivel académico no encontrado');

    return await this.careerRepo.find({
      where: { academicId },
      relations: ['academic'],
      order: { name: 'ASC' }
    });
  }

  async findAll() {
    return await this.careerRepo.find({
      relations: ['academic'],
    });
  }

  async findOne(id: string) {
    const career = await this.careerRepo.findOne({
      where: { id },
      relations: ['academic'],
    });
    if (!career) throw new NotFoundException('Carrera no encontrada');
    return career;
  }

  async update(id: string, updateCareerDto: UpdateCareerDto) {
    const career = await this.careerRepo.findOne({ where: { id } });
    if (!career) throw new NotFoundException('Carrera no encontrada');

    Object.assign(career, updateCareerDto);
    return await this.careerRepo.save(career);
  }

  async remove(id: string) {
    const result = await this.careerRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Carrera no encontrada');
    }
    return { message: 'Carrera eliminada con éxito' };
  }
}
