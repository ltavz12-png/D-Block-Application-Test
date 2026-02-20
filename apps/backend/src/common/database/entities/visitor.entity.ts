import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Location } from './location.entity';

export enum VisitorStatus {
  EXPECTED = 'expected',
  CHECKED_IN = 'checked_in',
  CHECKED_OUT = 'checked_out',
  NO_SHOW = 'no_show',
  CANCELLED = 'cancelled',
}

@Entity('visitors')
export class Visitor extends BaseEntity {
  @Index()
  @Column({ name: 'host_user_id', type: 'uuid' })
  hostUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'host_user_id' })
  hostUser: User;

  @Column({ name: 'location_id', type: 'uuid' })
  locationId: string;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @Column({ name: 'visitor_name', length: 255 })
  visitorName: string;

  @Column({ name: 'visitor_email', length: 255, nullable: true })
  visitorEmail: string | null;

  @Column({ name: 'visitor_phone', length: 20, nullable: true })
  visitorPhone: string | null;

  @Column({ name: 'visitor_company', length: 255, nullable: true })
  visitorCompany: string | null;

  @Column({ type: 'text', nullable: true })
  purpose: string | null;

  @Column({ name: 'expected_date', type: 'date' })
  expectedDate: Date;

  @Column({ name: 'expected_time', type: 'time', nullable: true })
  expectedTime: string | null;

  @Column({ type: 'enum', enum: VisitorStatus, default: VisitorStatus.EXPECTED })
  status: VisitorStatus;

  @Column({ name: 'checked_in_at', type: 'timestamptz', nullable: true })
  checkedInAt: Date | null;

  @Column({ name: 'checked_out_at', type: 'timestamptz', nullable: true })
  checkedOutAt: Date | null;

  @Column({ name: 'temp_access_key_id', length: 255, nullable: true })
  tempAccessKeyId: string | null;

  @Column({ name: 'notification_sent', default: false })
  notificationSent: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;
}
