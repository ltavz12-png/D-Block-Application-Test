import {
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  IsObject,
  IsArray,
  ArrayMinSize,
  MaxLength,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  NotificationType,
  NotificationChannel,
} from '@/common/database/entities/notification.entity';

export class SendNotificationDto {
  @ApiProperty({ description: 'User ID (UUID)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Notification type', enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: 'Delivery channels',
    enum: NotificationChannel,
    isArray: true,
    example: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(NotificationChannel, { each: true })
  channels: NotificationChannel[];

  @ApiProperty({ description: 'Notification title', example: 'Booking Confirmed' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Notification body', example: 'Your booking for Meeting Room A has been confirmed.' })
  @IsString()
  body: string;

  @ApiPropertyOptional({ description: 'Additional data payload (JSONB)', example: { bookingId: '123' } })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Language code', default: 'en', example: 'en' })
  @IsOptional()
  @IsIn(['en', 'ka'])
  language?: string = 'en';
}
