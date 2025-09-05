import { Module } from '@nestjs/common';
import { CareersService } from './careers.service';
import { CareersController } from './careers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Career } from './entities/career.entity';
import { Academic } from '../academic/entities/academic.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Career, Academic])
  ],
  controllers: [CareersController],
  providers: [CareersService],
})
export class CareersModule { }
