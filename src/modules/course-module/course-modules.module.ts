import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseModulesController } from './course-modules.controller';
import { CourseModule as CourseModuleEntity } from './entities/course-module.entity';
import { Quiz } from '../quiz/entities/quiz.entity';
import { CourseModulesService } from './course-modules.service';

@Module({
  imports: [TypeOrmModule.forFeature([CourseModuleEntity, Quiz])],
  controllers: [CourseModulesController],
  providers: [CourseModulesService],
  exports: [CourseModulesService]
})
export class CourseModulesModule {}