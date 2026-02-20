import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CompanyAddressDto {
  @ApiPropertyOptional({ description: 'Street address', example: '23 Rustaveli Ave' })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional({ description: 'City', example: 'Tbilisi' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'State or region', example: 'Tbilisi' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'ISO country letter code', example: 'GE' })
  @IsOptional()
  @IsString()
  countryLetterCode?: string;

  @ApiPropertyOptional({ description: 'Postal code', example: '0108' })
  @IsOptional()
  @IsString()
  postalCode?: string;
}

export class SyncCompanyDto {
  @ApiProperty({ description: 'Internal company ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Company display name', example: 'Adjara Group Holdings' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Tax identification number', example: '204987654' })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({ description: 'Primary contact email', example: 'finance@adjara.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number', example: '+995 32 2 000 000' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Company address', type: CompanyAddressDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CompanyAddressDto)
  address?: CompanyAddressDto;
}
