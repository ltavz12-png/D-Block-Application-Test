import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsDateString,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GeneratePromoCodesDto {
  @ApiProperty({ description: 'Promotion ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  promotionId: string;

  @ApiProperty({ description: 'Number of codes to generate', example: 50, minimum: 1, maximum: 1000 })
  @IsNumber()
  @Min(1)
  @Max(1000)
  count: number;

  @ApiPropertyOptional({ description: 'Prefix for generated codes', example: 'VISA', maxLength: 10 })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  prefix?: string;

  @ApiPropertyOptional({ description: 'Max uses per generated code', example: 1 })
  @IsOptional()
  @IsNumber()
  maxUsesPerCode?: number;

  @ApiPropertyOptional({ description: 'Codes valid from (ISO date string)', example: '2025-06-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ description: 'Codes valid until (ISO date string)', example: '2025-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;
}
