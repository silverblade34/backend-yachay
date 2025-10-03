import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class CheckVersionDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+\.\d+\.\d+$/, { message: 'Version must be in format X.Y.Z' })
  version: string; // Ejemplo: "1.0.0"

  @IsString()
  @IsNotEmpty()
  platform: string; // "android" | "ios"
}
