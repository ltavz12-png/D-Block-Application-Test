import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsString,
  IsObject,
} from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ description: 'Resource ID to book', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  resourceId: string;

  @ApiProperty({ description: 'Start time (ISO 8601)', example: '2025-06-15T09:00:00.000Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ description: 'End time (ISO 8601)', example: '2025-06-15T11:00:00.000Z' })
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({ description: 'Booking notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Promo code ID to apply' })
  @IsOptional()
  @IsUUID()
  promoCodeId?: string;

  @ApiPropertyOptional({ description: 'User pass ID for included-in-pass bookings' })
  @IsOptional()
  @IsUUID()
  passId?: string;

  @ApiPropertyOptional({ description: 'Pay with credits instead of cash', default: false })
  @IsOptional()
  @IsBoolean()
  payWithCredits?: boolean = false;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
