import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsNumber,
  IsOptional,
  IsString,
  IsPositive,
} from 'class-validator';

export class DeductCreditsDto {
  @ApiProperty({ description: 'Company ID', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  companyId: string;

  @ApiProperty({ description: 'User ID performing the deduction', example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Minutes to deduct', example: 60 })
  @IsNumber()
  @IsPositive()
  minutes: number;

  @ApiPropertyOptional({ description: 'Associated booking ID' })
  @IsOptional()
  @IsUUID()
  bookingId?: string;

  @ApiPropertyOptional({ description: 'Description of the deduction' })
  @IsOptional()
  @IsString()
  description?: string;
}
