
import { PartialType } from '@nestjs/mapped-types';
import { CreateCourseModuleDto } from './create-course-module.dto';

export class UpdateCourseModuleDto extends PartialType(CreateCourseModuleDto) {}

import { IsNotEmpty, IsUUID } from 'class-validator';

export class AddQuizToModuleDto {
  @IsNotEmpty({ message: 'El ID del quiz es obligatorio' })
  @IsUUID()
  quizId: string;
}