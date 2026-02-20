import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsUUID,
  IsArray,
  IsInt,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductType, BillingPeriod } from '@/common/database/entities/product.entity';

class IncludedResourceDto {
  @ApiProperty({ example: 'meeting_room' })
  @IsString()
  resourceType: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  hoursPerMonth?: number;

  @ApiPropertyOptional({ example: 'Access to meeting rooms' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Coworking Day Pass', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'კოვორკინგ დღიური აბონემენტი', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nameKa?: string;

  @ApiPropertyOptional({ example: 'Full-day access to coworking space' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'სრული დღის წვდომა კოვორკინგ სივრცეზე' })
  @IsOptional()
  @IsString()
  descriptionKa?: string;

  @ApiProperty({ enum: ProductType, example: ProductType.COWORKING_PASS })
  @IsEnum(ProductType)
  productType: ProductType;

  @ApiPropertyOptional({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiProperty({ enum: BillingPeriod, example: BillingPeriod.DAILY })
  @IsEnum(BillingPeriod)
  billingPeriod: BillingPeriod;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    type: [IncludedResourceDto],
    example: [{ resourceType: 'meeting_room', hoursPerMonth: 10, description: 'Access to meeting rooms' }],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IncludedResourceDto)
  includedResources?: IncludedResourceDto[];

  @ApiPropertyOptional({ example: ['WiFi', '24/7 Access', 'Free Coffee'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
