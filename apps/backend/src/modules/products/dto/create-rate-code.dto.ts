import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUUID,
  IsArray,
  IsObject,
  MaxLength,
  Min,
} from 'class-validator';

class RateCodeConditionsDto {
  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsString()
  validFrom?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsString()
  validUntil?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minQuantity?: number;

  @ApiPropertyOptional({ example: ['uuid-1', 'uuid-2'] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  locationIds?: string[];
}

export class CreateRateCodeDto {
  @ApiProperty({ example: 'STD-CWP-D', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code: string;

  @ApiProperty({ example: 'Standard Coworking Day Rate', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'სტანდარტული კოვორკინგ დღიური ტარიფი', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nameKa?: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 25.00, description: 'Rate amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: 'GEL', default: 'GEL', maxLength: 10 })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  taxInclusive?: boolean;

  @ApiPropertyOptional({ example: 18, default: 18, description: 'Tax rate percentage' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxRate?: number;

  @ApiPropertyOptional({
    type: RateCodeConditionsDto,
    example: { validFrom: '2025-01-01', validUntil: '2025-12-31', minQuantity: 1 },
  })
  @IsOptional()
  @IsObject()
  conditions?: RateCodeConditionsDto;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
