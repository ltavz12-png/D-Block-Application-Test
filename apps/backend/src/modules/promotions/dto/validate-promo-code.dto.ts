import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidatePromoCodeDto {
  @ApiProperty({ description: 'Promo code string', example: 'SUMMER2025' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'User ID (UUID) applying the code', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ description: 'Product ID being purchased (UUID)' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ description: 'Location ID (UUID)' })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiProperty({ description: 'Base amount before discount', example: 1500, minimum: 0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'Payment method or card brand (e.g., visa, mastercard)', example: 'visa' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}
