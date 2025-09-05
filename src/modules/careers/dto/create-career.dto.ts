import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateCareerDto {
  @IsNotEmpty()
  name: string;

  @IsUUID()
  academicId: string;
}
