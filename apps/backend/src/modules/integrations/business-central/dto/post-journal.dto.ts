import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsDateString,
  IsOptional,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class JournalEntryDto {
  @ApiProperty({ description: 'GL account number', example: '4100' })
  @IsString()
  accountNumber: string;

  @ApiProperty({ description: 'Entry amount (positive = debit, negative = credit)', example: 150.00 })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Posting date (YYYY-MM-DD)', example: '2025-01-31' })
  @IsDateString()
  postingDate: string;

  @ApiProperty({ description: 'Description of the journal entry', example: 'Room booking revenue recognition - January 2025' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Document reference number', example: 'REV-2025-01-001' })
  @IsOptional()
  @IsString()
  documentNumber?: string;
}

export class PostJournalDto {
  @ApiProperty({
    description: 'Array of journal entries to post',
    type: [JournalEntryDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => JournalEntryDto)
  entries: JournalEntryDto[];
}
