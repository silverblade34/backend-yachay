import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  ValidateNested,
  Min,
  Max,
  ArrayMinSize,
  IsEnum
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionType } from '../enum/question-type.enum';
import { DifficultyLevel } from '../enum/difficulty-level.enum';

export class QuestionTypeConfigDto {
  @IsEnum(QuestionType)
  type: QuestionType;

  @IsNumber({}, { message: 'El porcentaje debe ser un número' })
  @Min(0, { message: 'El porcentaje mínimo es 0' })
  @Max(100, { message: 'El porcentaje máximo es 100' })
  @Type(() => Number)
  percentage: number;

  @IsNumber({}, { message: 'La prioridad debe ser un número' })
  @Min(1, { message: 'La prioridad mínima es 1' })
  @Max(10, { message: 'La prioridad máxima es 10' })
  @Type(() => Number)
  priority: number;
}

export class CreateQuizDto {
  @IsNotEmpty({ message: 'El tema es obligatorio' })
  @IsString({ message: 'El tema debe ser un texto' })
  topic: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  description?: string;

  @IsNotEmpty({ message: 'La dificultad es obligatoria' })
  @IsEnum(DifficultyLevel, {
    message: 'La dificultad debe ser: beginner, intermediate, advanced o expert'
  })
  difficulty: DifficultyLevel;

  @IsNotEmpty({ message: 'La cantidad de preguntas es obligatoria' })
  @IsNumber({}, { message: 'La cantidad de preguntas debe ser un número' })
  @Type(() => Number)
  @Min(1, { message: 'Debe haber al menos 1 pregunta' })
  @Max(50, { message: 'Máximo 50 preguntas por vez' })
  questionCount: number;

  @IsNotEmpty({ message: 'Los tipos de pregunta son obligatorios' })
  @IsArray({ message: 'Los tipos de pregunta deben ser un array' })
  @ArrayMinSize(1, { message: 'Debe especificar al menos un tipo de pregunta' })
  @ValidateNested({ each: true })
  @Type(() => QuestionTypeConfigDto)
  questionTypes: QuestionTypeConfigDto[];

  @IsOptional()
  @IsString({ message: 'El idioma debe ser un texto' })
  language?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  focusAreas?: string[]; // Áreas específicas a enfatizar
}