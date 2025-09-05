import { IsNotEmpty, IsOptional, IsString, IsUUID, IsArray } from "class-validator";

export class CreatePreferenceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  categoryIds?: string[];
}
