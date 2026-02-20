import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateRateCodeDto } from './create-rate-code.dto';

export class UpdateRateCodeDto extends PartialType(
  OmitType(CreateRateCodeDto, ['productId'] as const),
) {}
