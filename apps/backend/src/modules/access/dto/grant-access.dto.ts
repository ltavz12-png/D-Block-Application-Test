import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsEnum,
  IsArray,
  IsOptional,
  IsString,
  IsIn,
  IsDateString,
  ValidateNested,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AccessLevel } from '@/common/database/entities/access-key.entity';

export class TimeRestrictionDto {
  @ApiProperty({
    description: 'Days of week (0=Sunday, 6=Saturday)',
    example: [1, 2, 3, 4, 5],
    type: [Number],
  })
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  dayOfWeek: number[];

  @ApiProperty({
    description: 'Start time in HH:mm format',
    example: '09:00',
  })
  @IsString()
  startTime: string;

  @ApiProperty({
    description: 'End time in HH:mm format',
    example: '18:00',
  })
  @IsString()
  endTime: string;
}

export class GrantAccessDto {
  @ApiProperty({
    description: 'User ID to grant access to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Location ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  locationId: string;

  @ApiProperty({
    description: 'Access level',
    enum: AccessLevel,
    example: AccessLevel.COMMON_AREAS,
  })
  @IsEnum(AccessLevel)
  accessLevel: AccessLevel;

  @ApiPropertyOptional({
    description: 'Specific resource IDs to grant access to',
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440002'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  resourceIds?: string[];

  @ApiProperty({
    description: 'Source type of the access grant',
    example: 'booking',
    enum: ['booking', 'pass', 'contract', 'manual'],
  })
  @IsString()
  @IsIn(['booking', 'pass', 'contract', 'manual'])
  sourceType: string;

  @ApiProperty({
    description: 'Source entity ID',
    example: '550e8400-e29b-41d4-a716-446655440003',
  })
  @IsUUID()
  sourceId: string;

  @ApiProperty({
    description: 'Access valid from (ISO 8601)',
    example: '2025-06-01T09:00:00Z',
  })
  @IsDateString()
  validFrom: string;

  @ApiPropertyOptional({
    description: 'Access valid until (ISO 8601)',
    example: '2025-06-01T18:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional({
    description: 'Time-based access restrictions',
    type: [TimeRestrictionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TimeRestrictionDto)
  timeRestrictions?: TimeRestrictionDto[];
}
