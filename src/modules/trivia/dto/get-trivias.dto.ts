import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetTriviasDto {
  @IsOptional()
  @IsString()
  sCategoria?: string;

  @IsOptional()
  @IsString()
  sDificultad?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  nCantidad?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  nEstado?: number;
}
