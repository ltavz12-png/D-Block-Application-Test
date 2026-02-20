import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ClosePeriodDto {
  @ApiPropertyOptional({ description: 'Notes about period closing' })
  @IsOptional()
  @IsString()
  closingNotes?: string;
}
