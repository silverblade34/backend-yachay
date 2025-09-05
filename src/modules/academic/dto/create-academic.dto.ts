
import { IsNotEmpty } from 'class-validator';

export class CreateAcademicDto {
  @IsNotEmpty()
  name: string;
}
