import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsObject,
} from 'class-validator';

export class PurchasePassDto {
  @ApiProperty({ description: 'Product ID to purchase', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({ description: 'Rate code ID for pricing' })
  @IsOptional()
  @IsUUID()
  rateCodeId?: string;

  @ApiProperty({ description: 'Pass start date (ISO 8601)', example: '2025-07-01' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ description: 'Enable auto-renewal', default: false })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean = false;

  @ApiPropertyOptional({ description: 'Payment ID if already paid' })
  @IsOptional()
  @IsUUID()
  paymentId?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
