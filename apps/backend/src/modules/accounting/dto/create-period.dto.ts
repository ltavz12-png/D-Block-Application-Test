import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, Matches } from 'class-validator';

export class CreatePeriodDto {
  @ApiProperty({ description: 'Period name in YYYY-MM format', example: '2025-01' })
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'name must be in YYYY-MM format' })
  name: string;

  @ApiProperty({ description: 'Period start date (ISO 8601)', example: '2025-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Period end date (ISO 8601)', example: '2025-01-31' })
  @IsDateString()
  endDate: string;
}
