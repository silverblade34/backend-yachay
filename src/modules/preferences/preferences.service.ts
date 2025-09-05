import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePreferenceDto } from './dto/create-preference.dto';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Preference } from './entities/preference.entity';
import { Repository } from 'typeorm';
import { Category } from '../category/entities/category.entity';

@Injectable()
export class PreferencesService {
  constructor(
    @InjectRepository(Preference)
    private preferenceRepo: Repository<Preference>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
  ) { }

  async createBulk(createPreferencesDto: CreatePreferenceDto[]) {
    const existingNames = createPreferencesDto.map(dto => dto.name);
    const existing = await this.preferenceRepo.find({
      where: existingNames.map(name => ({ name })),
    });

    if (existing.length > 0) {
      const duplicateNames = existing.map(p => p.name);
      throw new ConflictException(
        `Las siguientes preferencias ya existen: ${duplicateNames.join(', ')}`
      );
    }

    const preferences: Preference[] = [];

    for (const dto of createPreferencesDto) {
      const newPreference = new Preference();
      newPreference.name = dto.name;

      if (dto.categoryIds?.length) {
        const categories = await this.categoryRepo.findByIds(dto.categoryIds);
        if (categories.length !== dto.categoryIds.length) {
          throw new NotFoundException('Una o más categorías no fueron encontradas');
        }
        newPreference.categories = categories;
      }

      preferences.push(newPreference);
    }

    const saved = await this.preferenceRepo.save(preferences);

    return { count: saved.length, data: saved };
  }

  async create(dto: CreatePreferenceDto) {
    const preference = new Preference();
    preference.name = dto.name;

    if (dto.categoryIds?.length) {
      const categories = await this.categoryRepo.findByIds(dto.categoryIds);
      if (categories.length !== dto.categoryIds.length) {
        throw new NotFoundException('Una o más categorías no fueron encontradas');
      }
      preference.categories = categories;
    }

    return this.preferenceRepo.save(preference);
  }

  findAll() {
    return this.preferenceRepo.find({
      relations: ['categories']
    });
  }

  async findOne(id: string) {
    const preference = await this.preferenceRepo.findOne({
      where: { id },
      relations: ['category']
    });
    if (!preference) throw new NotFoundException('Preferencia no encontrada');
    return preference;
  }

  async update(id: string, dto: UpdatePreferenceDto) {
    const preference = await this.findOne(id);

    if (dto.name) preference.name = dto.name;

    if (dto.categoryIds?.length) {
      const categories = await this.categoryRepo.findByIds(dto.categoryIds);
      if (categories.length !== dto.categoryIds.length) {
        throw new NotFoundException('Una o más categorías no fueron encontradas');
      }
      preference.categories = categories;
    }

    return this.preferenceRepo.save(preference);
  }

  async remove(id: string) {
    const preference = await this.findOne(id);
    return this.preferenceRepo.remove(preference);
  }
}