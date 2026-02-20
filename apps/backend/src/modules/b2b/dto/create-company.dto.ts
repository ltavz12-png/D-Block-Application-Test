import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsEmail,
  IsObject,
  MaxLength,
} from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({ example: 'Adjara Group', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Location UUID the company belongs to',
  })
  @IsUUID()
  locationId: string;

  @ApiPropertyOptional({ example: '123456789', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string;

  @ApiPropertyOptional({ example: 'REG-2024-001', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  registrationNumber?: string;

  @ApiPropertyOptional({ example: '12 Rustaveli Ave, Tbilisi' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Giorgi Beridze', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  contactPersonName?: string;

  @ApiPropertyOptional({ example: 'contact@adjaragroup.com', maxLength: 255 })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  contactEmail?: string;

  @ApiPropertyOptional({ example: '+995551234567', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'billing@adjaragroup.com', maxLength: 255 })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  billingEmail?: string;

  @ApiPropertyOptional({
    example: { industry: 'hospitality', size: 'large' },
    description: 'Arbitrary metadata as JSON',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
