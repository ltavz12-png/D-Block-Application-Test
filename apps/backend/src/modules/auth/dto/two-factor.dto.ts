import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class Setup2faDto {
  @ApiProperty({ description: 'Current password to confirm identity' })
  @IsString()
  password: string;
}

export class Verify2faDto {
  @ApiProperty({ example: '123456', description: '6-digit TOTP code from authenticator app' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Code must be a 6-digit number' })
  code: string;
}
