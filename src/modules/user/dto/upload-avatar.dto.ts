
import { IsNotEmpty } from 'class-validator';

export class UploadAvatarDto {
  @IsNotEmpty()
  image: any;
}
