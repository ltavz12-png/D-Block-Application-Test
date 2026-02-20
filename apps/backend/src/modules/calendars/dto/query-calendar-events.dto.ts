import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { CalendarProvider } from '../providers/calendar-provider.interface';

export class QueryCalendarEventsDto {
  @ApiPropertyOptional({
    enum: CalendarProvider,
    description: 'Filter by calendar provider',
    example: CalendarProvider.GOOGLE,
  })
  @IsEnum(CalendarProvider)
  @IsOptional()
  provider?: CalendarProvider;

  @ApiPropertyOptional({
    description: 'Filter events starting from this date (ISO 8601)',
    example: '2025-01-01T00:00:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter events up to this date (ISO 8601)',
    example: '2025-12-31T23:59:59.000Z',
  })
  @IsDateString()
  @IsOptional()
  dateTo?: string;
}
