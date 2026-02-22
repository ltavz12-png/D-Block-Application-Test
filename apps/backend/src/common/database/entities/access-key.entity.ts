import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum AccessKeyStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
  SUSPENDED = 'suspended',
}

export enum AccessLevel {
  COMMON_AREAS = 'common_areas',
  BOOKED_ROOMS = 'booked_rooms',
  DEDICATED_BOX = 'dedicated_box',
  OFFICE = 'office',
  ALL_AREAS = 'all_areas',
}

@Entity('access_keys')
export class AccessKey extends BaseEntity {
  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'salto_key_id', type: 'varchar', length: 255, nullable: true })
  saltoKeyId: string | null;

  @Column({ name: 'access_level', type: 'enum', enum: AccessLevel })
  accessLevel: AccessLevel;

  @Column({ name: 'location_id', type: 'uuid' })
  locationId: string;

  @Column({ name: 'resource_ids', type: 'uuid', array: true, default: () => `'{}'` })
  resourceIds: string[];

  @Column({ type: 'enum', enum: AccessKeyStatus, default: AccessKeyStatus.ACTIVE })
  status: AccessKeyStatus;

  @Column({ name: 'valid_from', type: 'timestamptz' })
  validFrom: Date;

  @Column({ name: 'valid_until', type: 'timestamptz', nullable: true })
  validUntil: Date | null;

  @Column({ name: 'source_type', length: 50 })
  sourceType: string;

  @Column({ name: 'source_id', type: 'uuid' })
  sourceId: string;

  @Column({ name: 'is_visitor_key', default: false })
  isVisitorKey: boolean;

  @Column({ type: 'jsonb', nullable: true, name: 'time_restrictions' })
  timeRestrictions: {
    dayOfWeek: number[];
    startTime: string;
    endTime: string;
  }[] | null;
}
