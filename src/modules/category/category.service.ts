import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) { }

  async createBulk(createCategoriesDto: CreateCategoryDto[]) {
    try {
      const existingNames = createCategoriesDto.map(dto => dto.name);
      const existing = await this.categoryRepo.find({
        where: existingNames.map(name => ({ name })),
      });

      if (existing.length > 0) {
        const duplicateNames = existing.map(c => c.name);
        throw new ConflictException(
          `Las siguientes categorías ya existen: ${duplicateNames.join(', ')}`
        );
      }

      const categories = this.categoryRepo.create(createCategoriesDto);
      const savedCategories = await this.categoryRepo.save(categories);

      return {
        count: savedCategories.length,
        data: savedCategories,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Error al crear categorías: ${error.message}`);
    }
  }

  findAll() {
    return this.categoryRepo.find({
      relations: ['preferences'],
    });
  }

  async findOneWithPreferences(id: string) {
    const category = await this.categoryRepo.findOne({
      where: { id },
      relations: ['preferences']
    });
    if (!category) throw new NotFoundException('Categoria no encontrada');
    return category;
  }

  async findOne(id: string) {
    const category = await this.categoryRepo.findOne({ where: { id }, relations: ['categories'] });
    if (!category) throw new NotFoundException('Categoria no encontrada');
    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(id);
    Object.assign(category, updateCategoryDto);
    return this.categoryRepo.save(category);
  }

  async remove(id: string) {
    const category = await this.findOne(id);

    const categoryWithPrefs = await this.findOneWithPreferences(id);
    if (categoryWithPrefs.preferences && categoryWithPrefs.preferences.length > 0) {
      throw new ConflictException(
        `No se puede eliminar la categoría porque tiene ${categoryWithPrefs.preferences.length} preferencias asociadas`
      );
    }

    return this.categoryRepo.remove(category);
  }
}
