import { IsString, IsInt, Min, Max, IsOptional, MaxLength } from 'class-validator';

export class CreateTriviaDto {
  @IsString()
  @MaxLength(2000)
  sPregunta: string;

  @IsString()
  @MaxLength(500)
  sOpcionA: string;

  @IsString()
  @MaxLength(500)
  sOpcionB: string;

  @IsString()
  @MaxLength(500)
  sOpcionC: string;

  @IsString()
  @MaxLength(500)
  sOpcionD: string;

  @IsInt()
  @Min(0)
  @Max(3)
  nRespuestaCorrecta: number;

  @IsString()
  @MaxLength(100)
  sCategoria: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  sDatoInteresante?: string;

  @IsString()
  @IsOptional()
  sDificultad?: string;
}
