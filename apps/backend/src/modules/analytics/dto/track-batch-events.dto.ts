import { IsArray, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TrackEventDto } from './track-event.dto';

export class TrackBatchEventsDto {
  @ApiProperty({
    description: 'Array of events to track (1-100)',
    type: [TrackEventDto],
    minItems: 1,
    maxItems: 100,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @Type(() => TrackEventDto)
  events: TrackEventDto[];
}
