import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateConsentDto {
  @ApiPropertyOptional({ description: 'Consent for analytics tracking' })
  @IsOptional()
  @IsBoolean()
  analytics?: boolean;

  @ApiPropertyOptional({ description: 'Consent for marketing communications' })
  @IsOptional()
  @IsBoolean()
  marketing?: boolean;

  @ApiPropertyOptional({ description: 'Consent for personalized experiences' })
  @IsOptional()
  @IsBoolean()
  personalization?: boolean;
}
