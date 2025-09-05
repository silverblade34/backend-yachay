import { Module } from '@nestjs/common';
import { AcademicService } from './academic.service';
import { AcademicController } from './academic.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Academic } from './entities/academic.entity';

@Module({
  imports : [
    TypeOrmModule.forFeature([Academic])
  ],
  controllers: [AcademicController],
  providers: [AcademicService],
})
export class AcademicModule {}
