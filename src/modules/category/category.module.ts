import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Preference } from '../preferences/entities/preference.entity';

@Module({
  imports : [
    TypeOrmModule.forFeature([Category, Preference])
  ],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}
