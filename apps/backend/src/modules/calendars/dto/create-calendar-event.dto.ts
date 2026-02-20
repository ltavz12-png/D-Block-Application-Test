import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateCalendarEventDto {
  @ApiPropertyOptional({
    description: 'Booking ID to link this event to an existing booking',
    example: 'b1e2c3d4-5678-90ab-cdef-1234567890ab',
  })
  @IsUUID()
  @IsOptional()
  bookingId?: string;

  @ApiProperty({
    description: 'Event title',
    example: 'Meeting Room A - D Block Stamba',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Event description',
    example: 'Booking at D Block Workspace',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Event location',
    example: 'D Block Stamba, Tbilisi',
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    description: 'Event start time in ISO 8601 format',
    example: '2025-01-15T10:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({
    description: 'Event end time in ISO 8601 format',
    example: '2025-01-15T12:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @ApiPropertyOptional({
    description: 'Time zone for the event',
    example: 'Asia/Tbilisi',
    default: 'Asia/Tbilisi',
  })
  @IsString()
  @IsOptional()
  timeZone?: string = 'Asia/Tbilisi';
}
