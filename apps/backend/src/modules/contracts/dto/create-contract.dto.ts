import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsEnum,
  IsDateString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsObject,
  IsArray,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { ContractType } from '@/common/database/entities/contract.entity';

export class CreateContractDto {
  @ApiProperty({ description: 'Company ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  companyId: string;

  @ApiProperty({ description: 'Location ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  locationId: string;

  @ApiProperty({ description: 'Contract type', enum: ContractType })
  @IsEnum(ContractType)
  contractType: ContractType;

  @ApiProperty({ description: 'Contract start date (ISO 8601)', example: '2025-07-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Contract end date (ISO 8601)', example: '2026-06-30' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'Monthly amount', example: 5000 })
  @IsNumber()
  @IsPositive()
  monthlyAmount: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'GEL', example: 'GEL' })
  @IsOptional()
  @IsString()
  currency?: string = 'GEL';

  @ApiPropertyOptional({ description: 'Auto-renew contract', default: false })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean = false;

  @ApiPropertyOptional({ description: 'Notice period in days', default: 30, example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  noticePeriodDays?: number = 30;

  @ApiPropertyOptional({ description: 'Area in square meters', example: 120.5 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  areaSqm?: number;

  @ApiPropertyOptional({ description: 'Price per square meter', example: 45.0 })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  pricePerSqm?: number;

  @ApiPropertyOptional({
    description: 'Resource IDs included in the contract',
    type: [String],
    example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  resourceIds?: string[];

  @ApiPropertyOptional({ description: 'Contract terms (JSONB)' })
  @IsOptional()
  @IsObject()
  terms?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Additional metadata (JSONB)' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
