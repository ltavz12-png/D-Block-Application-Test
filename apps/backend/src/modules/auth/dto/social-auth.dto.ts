import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional } from 'class-validator';

export class SocialAuthCallbackDto {
  @ApiProperty({ description: 'Authorization code from OAuth provider' })
  @IsString()
  code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  state?: string;
}

export class SocialAuthTokenDto {
  @ApiProperty({ description: 'ID token or access token from social provider' })
  @IsString()
  token: string;
}

export interface SocialProfile {
  provider: string;
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
}
