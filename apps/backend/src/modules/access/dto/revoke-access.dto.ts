import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RevokeAccessDto {
  @ApiPropertyOptional({
    description: 'Reason for revoking access',
    example: 'Booking cancelled',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
