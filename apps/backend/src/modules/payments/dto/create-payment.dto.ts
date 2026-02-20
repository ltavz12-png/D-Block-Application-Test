import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsPositive,
  IsEnum,
  IsOptional,
  IsString,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import {
  PaymentMethod,
  PaymentGateway,
} from '@/common/database/entities/payment.entity';

export class CreatePaymentDto {
  @ApiProperty({ example: 150.0, description: 'Payment amount (must be positive)' })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({ example: 'GEL', default: 'GEL', maxLength: 10 })
  @IsOptional()
  @IsString()
  currency?: string = 'GEL';

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.BOG_CARD,
    description: 'Payment method',
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({
    enum: PaymentGateway,
    example: PaymentGateway.MOCK,
    default: PaymentGateway.MOCK,
    description: 'Payment gateway to use',
  })
  @IsOptional()
  @IsEnum(PaymentGateway)
  paymentGateway?: PaymentGateway = PaymentGateway.MOCK;

  @ApiPropertyOptional({ example: 'Monthly membership payment' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: { bookingId: '123', membershipId: '456' },
    description: 'Additional metadata for the payment',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    example: 18,
    default: 18,
    description: 'Tax rate percentage (0-100)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate?: number = 18;
}
