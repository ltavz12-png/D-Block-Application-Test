import {
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsDateString,
  IsObject,
  IsIn,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AnalyticsEventCategory } from '@/common/database/entities/analytics-event.entity';

export class TrackEventDto {
  @ApiProperty({ description: 'Event name', example: 'user.signup', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  eventName: string;

  @ApiProperty({
    description: 'Event category',
    enum: AnalyticsEventCategory,
    example: AnalyticsEventCategory.USER,
  })
  @IsEnum(AnalyticsEventCategory)
  category: AnalyticsEventCategory;

  @ApiPropertyOptional({ description: 'Custom event properties (JSON)', example: { method: 'google' } })
  @IsOptional()
  @IsObject()
  properties?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Location ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional({ description: 'Client session ID', example: 'sess_abc123' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sessionId?: string;

  @ApiPropertyOptional({
    description: 'Platform the event originated from',
    enum: ['ios', 'android', 'web', 'admin'],
    example: 'web',
  })
  @IsOptional()
  @IsIn(['ios', 'android', 'web', 'admin'])
  platform?: string;

  @ApiPropertyOptional({ description: 'App version', example: '2.1.0' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  appVersion?: string;

  @ApiPropertyOptional({ description: 'When the event occurred (ISO string, defaults to now)', example: '2025-06-15T10:30:00Z' })
  @IsOptional()
  @IsDateString()
  occurredAt?: string;
}
