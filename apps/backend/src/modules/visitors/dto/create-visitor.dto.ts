import {
  IsString,
  IsUUID,
  IsOptional,
  IsEmail,
  IsDateString,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVisitorDto {
  @ApiProperty({ description: 'Location ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  locationId: string;

  @ApiProperty({ description: 'Full name of the visitor', example: 'Jane Smith' })
  @IsString()
  @MaxLength(255)
  visitorName: string;

  @ApiPropertyOptional({ description: 'Visitor email address', example: 'jane@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  visitorEmail?: string;

  @ApiPropertyOptional({ description: 'Visitor phone number', example: '+995555123456' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  visitorPhone?: string;

  @ApiPropertyOptional({ description: 'Visitor company name', example: 'Acme Corp' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  visitorCompany?: string;

  @ApiPropertyOptional({ description: 'Purpose of the visit', example: 'Business meeting' })
  @IsOptional()
  @IsString()
  purpose?: string;

  @ApiProperty({ description: 'Expected date of visit (ISO date string)', example: '2025-03-20' })
  @IsDateString()
  expectedDate: string;

  @ApiPropertyOptional({ description: 'Expected time of visit (HH:mm format)', example: '14:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'expectedTime must be in HH:mm format' })
  expectedTime?: string;
}
