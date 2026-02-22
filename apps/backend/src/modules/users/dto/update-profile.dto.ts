import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsIn, IsObject } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ enum: ['en', 'ka'] })
  @IsOptional()
  @IsIn(['en', 'ka'])
  preferredLanguage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  notificationPreferences?: {
    push: boolean;
    email: boolean;
    sms: boolean;
    marketing: boolean;
  };
}
