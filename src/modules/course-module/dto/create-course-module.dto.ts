import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsUUID,
  MaxLength,
  IsHexColor
} from 'class-validator';

export class CreateCourseModuleDto {
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString({ message: 'El nombre debe ser un texto' })
  @MaxLength(255, { message: 'El nombre no puede exceder 255 caracteres' })
  name: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'La imagen de portada debe ser un texto' })
  coverImage?: string;

  @IsOptional()
  @IsHexColor({ message: 'El color debe ser un código hexadecimal válido' })
  color?: string;

  @IsOptional()
  @IsBoolean({ message: 'isPublic debe ser un valor booleano' })
  isPublic?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'allowCollaboration debe ser un valor booleano' })
  allowCollaboration?: boolean;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
