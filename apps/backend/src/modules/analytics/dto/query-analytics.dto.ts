import {
  IsOptional,
  IsString,
  IsUUID,
  IsEnum,
  IsDateString,
  IsIn,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AnalyticsEventCategory } from '@/common/database/entities/analytics-event.entity';

export class QueryAnalyticsDto {
  @ApiPropertyOptional({ description: 'Filter by event name', example: 'user.signup' })
  @IsOptional()
  @IsString()
  eventName?: string;

  @ApiPropertyOptional({ description: 'Filter by event category', enum: AnalyticsEventCategory })
  @IsOptional()
  @IsEnum(AnalyticsEventCategory)
  category?: AnalyticsEventCategory;

  @ApiPropertyOptional({ description: 'Filter by user ID (UUID)' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Filter by location ID (UUID)' })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional({ description: 'Filter by platform', enum: ['ios', 'android', 'web', 'admin'] })
  @IsOptional()
  @IsIn(['ios', 'android', 'web', 'admin'])
  platform?: string;

  @ApiPropertyOptional({ description: 'Filter events from this date (ISO string)', example: '2025-06-01' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter events until this date (ISO string)', example: '2025-06-30' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 50, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;
}
