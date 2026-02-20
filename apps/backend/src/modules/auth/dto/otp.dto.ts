import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, IsIn } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({ example: '+995555123456' })
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format' })
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+995555123456' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'OTP must be a 6-digit code' })
  code: string;
}
