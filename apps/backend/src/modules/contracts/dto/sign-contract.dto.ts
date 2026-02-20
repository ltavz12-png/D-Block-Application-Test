import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl } from 'class-validator';

export class SignContractDto {
  @ApiProperty({ description: 'Name of the company signer', example: 'John Doe' })
  @IsString()
  signedByCompany: string;

  @ApiProperty({ description: 'Name of the D Block signer', example: 'Jane Smith' })
  @IsString()
  signedByDblock: string;

  @ApiPropertyOptional({ description: 'Signed document URL' })
  @IsOptional()
  @IsString()
  documentUrl?: string;

  @ApiPropertyOptional({ description: 'DocuSign envelope ID' })
  @IsOptional()
  @IsString()
  docusignEnvelopeId?: string;
}
