import {
  IsArray,
  IsEnum,
  IsBoolean,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  NotificationType,
  NotificationChannel,
} from '@/common/database/entities/notification.entity';

export class NotificationPreferenceItemDto {
  @ApiProperty({ description: 'Notification type', enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: 'Channels to deliver this notification type through',
    enum: NotificationChannel,
    isArray: true,
    example: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
  })
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels: NotificationChannel[];

  @ApiProperty({ description: 'Whether this notification type is enabled', example: true })
  @IsBoolean()
  enabled: boolean;
}

export class UpdateNotificationPreferencesDto {
  @ApiProperty({
    description: 'Array of notification preference items',
    type: [NotificationPreferenceItemDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => NotificationPreferenceItemDto)
  preferences: NotificationPreferenceItemDto[];
}
