import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsUUID,
  IsArray,
  IsIn,
  ValidateNested,
  MaxLength,
  Min,
  IsDefined,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DiscountType } from '@/common/database/entities/promotion.entity';

export class RuleConditionDto {
  @ApiProperty({
    description: 'Field to evaluate (e.g., paymentMethod, location, product, orderTotal)',
    example: 'paymentMethod',
  })
  @IsString()
  field: string;

  @ApiProperty({
    description: 'Comparison operator',
    enum: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'in'],
    example: 'equals',
  })
  @IsIn(['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'in'])
  operator: string;

  @ApiProperty({
    description: 'Value to compare against',
    example: 'visa',
  })
  @IsDefined()
  value: any;
}

export class RulesDto {
  @ApiProperty({
    description: 'Array of rule conditions',
    type: [RuleConditionDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleConditionDto)
  conditions: RuleConditionDto[];

  @ApiProperty({
    description: 'Logical operator to combine conditions',
    enum: ['AND', 'OR'],
    example: 'AND',
  })
  @IsIn(['AND', 'OR'])
  logic: 'AND' | 'OR';
}

export class CreatePromotionDto {
  @ApiProperty({ description: 'Promotion name', example: 'VISA x FLEX - 500 GEL' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Promotion description', example: 'Get 500 GEL discount when paying with VISA' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Promotion rules with conditions and logic',
    type: RulesDto,
  })
  @ValidateNested()
  @Type(() => RulesDto)
  rules: RulesDto;

  @ApiProperty({
    description: 'Discount type',
    enum: DiscountType,
    example: DiscountType.FIXED_AMOUNT,
  })
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @ApiProperty({ description: 'Discount value', example: 500 })
  @IsNumber()
  @Min(0)
  discountValue: number;

  @ApiPropertyOptional({ description: 'Maximum discount amount (for percentage type)', example: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscountAmount?: number;

  @ApiProperty({ description: 'Promotion valid from (ISO date string)', example: '2025-06-01T00:00:00.000Z' })
  @IsDateString()
  validFrom: string;

  @ApiPropertyOptional({ description: 'Promotion valid until (ISO date string)', example: '2025-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional({ description: 'Total usage limit across all users', example: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;

  @ApiPropertyOptional({ description: 'Usage limit per user', example: 3 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  perUserLimit?: number;

  @ApiPropertyOptional({
    description: 'Array of location IDs where promotion is valid',
    type: [String],
    example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  locationIds?: string[];

  @ApiPropertyOptional({
    description: 'Array of product IDs the promotion applies to',
    type: [String],
    example: ['b2c3d4e5-f6a7-8901-bcde-f12345678901'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  productIds?: string[];
}
