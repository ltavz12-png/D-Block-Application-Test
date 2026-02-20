import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  IsArray,
  ValidateNested,
  IsObject,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LineItemDto {
  @ApiProperty({ description: 'Line item description', example: 'Meeting room booking' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Line item description in Georgian', example: 'საკონფერენციო ოთახის დაჯავშნა' })
  @IsString()
  descriptionKa: string;

  @ApiProperty({ description: 'Quantity', example: 1 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ description: 'Unit price', example: 100.0 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ description: 'Tax rate percentage', example: 18 })
  @IsNumber()
  @Min(0)
  taxRate: number;

  @ApiPropertyOptional({ description: 'Product ID reference' })
  @IsOptional()
  @IsString()
  productId?: string;
}

export class CreateInvoiceDto {
  @ApiPropertyOptional({ description: 'User ID for individual invoice' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Company ID for B2B invoice' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiProperty({ description: 'Invoice line items', type: [LineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineItemDto)
  lineItems: LineItemDto[];

  @ApiProperty({ description: 'Issue date (ISO 8601)', example: '2025-06-01' })
  @IsDateString()
  issueDate: string;

  @ApiProperty({ description: 'Due date (ISO 8601)', example: '2025-06-15' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ description: 'Billing period start date' })
  @IsOptional()
  @IsDateString()
  periodStart?: string;

  @ApiPropertyOptional({ description: 'Billing period end date' })
  @IsOptional()
  @IsDateString()
  periodEnd?: string;

  @ApiPropertyOptional({ description: 'Currency code', default: 'GEL' })
  @IsOptional()
  @IsString()
  currency?: string = 'GEL';

  @ApiPropertyOptional({ description: 'Invoice language', default: 'en' })
  @IsOptional()
  @IsString()
  language?: string = 'en';

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
