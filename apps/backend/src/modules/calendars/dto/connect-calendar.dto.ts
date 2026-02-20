import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CalendarProvider } from '../providers/calendar-provider.interface';

export class ConnectCalendarDto {
  @ApiProperty({
    enum: CalendarProvider,
    description: 'Calendar provider to connect',
    example: CalendarProvider.GOOGLE,
  })
  @IsEnum(CalendarProvider)
  @IsNotEmpty()
  provider: CalendarProvider;

  @ApiProperty({
    description: 'OAuth authorization code received from the provider',
    example: '4/0AfJohXl...',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({
    description: 'State parameter from OAuth flow for CSRF verification',
    example: 'user-uuid-here',
  })
  @IsString()
  @IsOptional()
  state?: string;
}
