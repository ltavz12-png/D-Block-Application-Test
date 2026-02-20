import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  IsPositive,
} from 'class-validator';

export class PurchaseCreditPackageDto {
  @ApiProperty({ description: 'Company ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  companyId: string;

  @ApiProperty({ description: 'Total minutes in the package', example: 600 })
  @IsNumber()
  @IsPositive()
  totalMinutes: number;

  @ApiProperty({ description: 'Purchase price', example: 500.0 })
  @IsNumber()
  @IsPositive()
  purchasePrice: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'GEL' })
  @IsOptional()
  @IsString()
  currency?: string = 'GEL';

  @ApiPropertyOptional({ description: 'Expiration date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Payment ID if already paid' })
  @IsOptional()
  @IsUUID()
  paymentId?: string;
}
