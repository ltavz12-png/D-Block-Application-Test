import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsUUID,
  IsArray,
  IsObject,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ResourceType,
  PricingModel,
  MeasurementUnit,
} from '@/common/database/entities/resource.entity';

class PricingDetailsDto {
  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @ApiPropertyOptional({ example: 'GEL' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  perHour?: number;

  @ApiPropertyOptional({ example: 80 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  perDay?: number;

  @ApiPropertyOptional({ example: 1500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  perMonth?: number;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  perSqm?: number;
}

class AvailabilityRuleDto {
  @ApiProperty({ example: 1, description: '0=Sunday, 1=Monday, ..., 6=Saturday' })
  @IsNumber()
  @Min(0)
  dayOfWeek: number;

  @ApiProperty({ example: '09:00' })
  @IsString()
  openTime: string;

  @ApiProperty({ example: '18:00' })
  @IsString()
  closeTime: string;
}

class BookingRulesDto {
  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minDurationMinutes?: number;

  @ApiPropertyOptional({ example: 480 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDurationMinutes?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  advanceBookingDays?: number;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bufferMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cancellationPolicyId?: string;
}

export class CreateResourceDto {
  @ApiProperty({ example: 'Meeting Room A', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  locationId: string;

  @ApiProperty({ enum: ResourceType, example: ResourceType.MEETING_ROOM })
  @IsEnum(ResourceType)
  resourceType: ResourceType;

  @ApiPropertyOptional({ example: 'Block A', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  block?: string;

  @ApiPropertyOptional({ example: '3rd Floor', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  floor?: string;

  @ApiPropertyOptional({ example: 25.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  size?: number;

  @ApiPropertyOptional({ enum: MeasurementUnit, default: MeasurementUnit.SQM })
  @IsOptional()
  @IsEnum(MeasurementUnit)
  measurementUnit?: MeasurementUnit;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  capacity?: number;

  @ApiPropertyOptional({ enum: PricingModel, default: PricingModel.HOURLY })
  @IsOptional()
  @IsEnum(PricingModel)
  pricingModel?: PricingModel;

  @ApiPropertyOptional({ type: PricingDetailsDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PricingDetailsDto)
  pricingDetails?: PricingDetailsDto;

  @ApiPropertyOptional({ type: [AvailabilityRuleDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilityRuleDto)
  availabilityRules?: AvailabilityRuleDto[];

  @ApiPropertyOptional({ type: BookingRulesDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => BookingRulesDto)
  bookingRules?: BookingRulesDto;

  @ApiPropertyOptional({ example: ['wifi', 'projector', 'whiteboard'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({ example: ['https://cdn.dblock.ge/rooms/a.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isBookable?: boolean;

  @ApiPropertyOptional({ example: 'salto-lock-001', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  saltoLockId?: string;
}
