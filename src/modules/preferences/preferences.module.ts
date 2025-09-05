import { Module } from '@nestjs/common';
import { PreferencesService } from './preferences.service';
import { PreferencesController } from './preferences.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Preference } from './entities/preference.entity';
import { Category } from '../category/entities/category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Preference]),
    TypeOrmModule.forFeature([Category])
  ],
  controllers: [PreferencesController],
  providers: [PreferencesService],
})
export class PreferencesModule { }
