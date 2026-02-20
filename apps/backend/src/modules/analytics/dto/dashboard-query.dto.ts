import { IsDateString, IsOptional, IsUUID, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardQueryDto {
  @ApiProperty({ description: 'Start date (ISO string)', example: '2025-06-01' })
  @IsDateString()
  dateFrom: string;

  @ApiProperty({ description: 'End date (ISO string)', example: '2025-06-30' })
  @IsDateString()
  dateTo: string;

  @ApiPropertyOptional({ description: 'Filter by location ID (UUID)' })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional({
    description: 'Time granularity for grouping',
    enum: ['hour', 'day', 'week', 'month'],
    default: 'day',
  })
  @IsOptional()
  @IsIn(['hour', 'day', 'week', 'month'])
  granularity?: 'hour' | 'day' | 'week' | 'month';
}
