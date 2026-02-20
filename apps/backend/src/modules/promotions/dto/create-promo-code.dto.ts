import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsDateString,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePromoCodeDto {
  @ApiProperty({ description: 'Promotion ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  promotionId: string;

  @ApiPropertyOptional({
    description: 'Promo code string (auto-generated if not provided). Uppercase alphanumeric only.',
    example: 'SUMMER2025',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Z0-9]+$/, { message: 'Code must be uppercase alphanumeric characters only' })
  code?: string;

  @ApiPropertyOptional({ description: 'Maximum number of times this code can be used', example: 100 })
  @IsOptional()
  @IsNumber()
  maxUses?: number;

  @ApiPropertyOptional({ description: 'Code valid from (ISO date string)', example: '2025-06-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ description: 'Code valid until (ISO date string)', example: '2025-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;
}
