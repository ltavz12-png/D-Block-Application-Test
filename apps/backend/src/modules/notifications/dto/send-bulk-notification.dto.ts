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

export class SendBulkNotificationDto {
  @ApiPropertyOptional({
    description: 'User IDs to send to (if empty, broadcasts to all users)',
    type: [String],
    example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  userIds?: string[];

  @ApiProperty({ description: 'Notification type', enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: 'Delivery channels',
    enum: NotificationChannel,
    isArray: true,
    example: [NotificationChannel.IN_APP],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(NotificationChannel, { each: true })
  channels: NotificationChannel[];

  @ApiProperty({ description: 'Notification title', example: 'System Announcement' })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: 'Notification body', example: 'D Block Workspace will be closed on January 1st.' })
  @IsString()
  body: string;

  @ApiPropertyOptional({ description: 'Additional data payload (JSONB)', example: { announcementId: '456' } })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Language code', default: 'en', example: 'en' })
  @IsOptional()
  @IsIn(['en', 'ka'])
  language?: string = 'en';
}
