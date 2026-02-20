import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum NotificationType {
  BOOKING_CONFIRMATION = 'booking_confirmation',
  BOOKING_REMINDER = 'booking_reminder',
  BOOKING_CANCELLATION = 'booking_cancellation',
  PAYMENT_RECEIPT = 'payment_receipt',
  PAYMENT_FAILED = 'payment_failed',
  CREDIT_LOW = 'credit_low',
  CREDIT_DEPLETED = 'credit_depleted',
  PASS_EXPIRING = 'pass_expiring',
  PASS_EXPIRED = 'pass_expired',
  PASS_RENEWED = 'pass_renewed',
  CONTRACT_RENEWAL = 'contract_renewal',
  VISITOR_ARRIVING = 'visitor_arriving',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  PROMOTION = 'promotion',
}

export enum NotificationChannel {
  PUSH = 'push',
  EMAIL = 'email',
  SMS = 'sms',
  IN_APP = 'in_app',
}

@Entity('notifications')
export class Notification extends BaseEntity {
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ type: 'enum', enum: NotificationChannel })
  channel: NotificationChannel;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any> | null;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt: Date | null;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt: Date | null;

  @Column({ name: 'delivery_status', length: 20, default: 'pending' })
  deliveryStatus: string;

  @Column({ length: 5, default: 'en' })
  language: string;
}
