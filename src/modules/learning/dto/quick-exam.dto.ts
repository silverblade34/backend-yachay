import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  IsEnum
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DifficultyLevel } from '../enum/difficulty-level.enum';

export class QuickExamDto {
  @ApiProperty({ 
    description: 'Tema del examen rápido',
    example: 'Matemáticas básicas'
  })
  @IsNotEmpty({ message: 'El tema es obligatorio' })
  @IsString({ message: 'El tema debe ser un texto' })
  topic: string;

  @ApiPropertyOptional({ 
    minimum: 3, 
    maximum: 20, 
    description: 'Cantidad de preguntas',
    default: 5
  })
  @IsOptional()
  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @Min(3, { message: 'Mínimo 3 preguntas' })
  @Max(20, { message: 'Máximo 20 preguntas para examen rápido' })
  @Type(() => Number)
  count?: number;

  @ApiPropertyOptional({ 
    enum: DifficultyLevel, 
    description: 'Nivel de dificultad',
    default: DifficultyLevel.INTERMEDIATE
  })
  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty?: DifficultyLevel;

  @ApiPropertyOptional({ 
    description: 'Incluir solo preguntas básicas' 
  })
  @IsOptional()
  @IsBoolean()
  basicOnly?: boolean;
}
