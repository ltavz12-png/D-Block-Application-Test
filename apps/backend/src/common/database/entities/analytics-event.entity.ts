import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

export enum AnalyticsEventCategory {
  USER = 'user',
  BOOKING = 'booking',
  PAYMENT = 'payment',
  ACCESS = 'access',
  ENGAGEMENT = 'engagement',
  SYSTEM = 'system',
}

@Entity('analytics_events')
export class AnalyticsEvent extends BaseEntity {
  @Index()
  @Column({ name: 'event_name', length: 100 })
  eventName: string;

  @Column({ type: 'enum', enum: AnalyticsEventCategory })
  category: AnalyticsEventCategory;

  @Index()
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'session_id', type: 'varchar', length: 100, nullable: true })
  sessionId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  properties: Record<string, any> | null;

  @Column({ name: 'location_id', type: 'uuid', nullable: true })
  locationId: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  platform: string | null;

  @Column({ name: 'app_version', type: 'varchar', length: 20, nullable: true })
  appVersion: string | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @Index()
  @Column({ name: 'occurred_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  occurredAt: Date;
}
