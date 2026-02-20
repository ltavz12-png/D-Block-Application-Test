import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUUID, IsNumber, IsDateString, IsOptional } from 'class-validator';

export class RevenueAdjustmentDto {
  @ApiProperty({ description: 'Source type (booking, pass, contract)', example: 'booking' })
  @IsString()
  sourceType: string;

  @ApiProperty({ description: 'Source entity ID' })
  @IsUUID()
  sourceId: string;

  @ApiProperty({ description: 'Adjustment amount (positive or negative)', example: -50.00 })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Adjustment date (ISO 8601)', example: '2025-01-15' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Reason for the adjustment' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Location ID' })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional({ description: 'Product type' })
  @IsOptional()
  @IsString()
  productType?: string;
}
