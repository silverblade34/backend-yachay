import { IsString, IsNotEmpty } from 'class-validator';

export class FirebaseAuthDto {
  @IsString()
  @IsNotEmpty()
  firebase_token: string;
}