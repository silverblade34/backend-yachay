import { IsUUID, IsNotEmpty, IsArray, ArrayNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CareerItemDto {
  @IsNotEmpty()
  name: string;
}

export class CreateManyCareersDto {
  @IsUUID()
  academicId: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CareerItemDto)
  careers: CareerItemDto[];
}
