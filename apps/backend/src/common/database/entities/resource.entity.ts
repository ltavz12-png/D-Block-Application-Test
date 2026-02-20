import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { BaseEntityWithCreator } from './base.entity';
import { Location } from './location.entity';
import { Booking } from './booking.entity';

export enum ResourceType {
  MEETING_ROOM = 'meeting_room',
  HOT_DESK = 'hot_desk',
  FIXED_DESK = 'fixed_desk',
  BOX = 'box',
  OFFICE = 'office',
  PARKING = 'parking',
  LOCKER = 'locker',
  PHONE_BOOTH = 'phone_booth',
  EVENT_SPACE = 'event_space',
  EQUIPMENT = 'equipment',
}

export enum PricingModel {
  HOURLY = 'hourly',
  DAILY = 'daily',
  MONTHLY = 'monthly',
  PER_USE = 'per_use',
  INCLUDED_IN_PASS = 'included_in_pass',
  CREDIT_BASED = 'credit_based',
  PER_SQM = 'per_sqm',
}

export enum MeasurementUnit {
  SQM = 'sqm',
  PAX = 'pax',
}

@Entity('resources')
export class Resource extends BaseEntityWithCreator {
  @Column({ length: 255 })
  name: string;

  @Index()
  @Column({ name: 'location_id', type: 'uuid' })
  locationId: string;

  @ManyToOne(() => Location, (location) => location.resources)
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @Column({ type: 'enum', enum: ResourceType, name: 'resource_type' })
  resourceType: ResourceType;

  @Column({ length: 100, nullable: true })
  block: string | null;

  @Column({ length: 100, nullable: true })
  floor: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  size: number;

  @Column({
    type: 'enum',
    enum: MeasurementUnit,
    default: MeasurementUnit.SQM,
    name: 'measurement_unit',
  })
  measurementUnit: MeasurementUnit;

  @Column({ type: 'int', default: 0 })
  capacity: number;

  @Column({
    type: 'enum',
    enum: PricingModel,
    name: 'pricing_model',
    default: PricingModel.HOURLY,
  })
  pricingModel: PricingModel;

  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'pricing_details',
  })
  pricingDetails: {
    basePrice?: number;
    currency?: string;
    perHour?: number;
    perDay?: number;
    perMonth?: number;
    perSqm?: number;
  } | null;

  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'availability_rules',
  })
  availabilityRules: {
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
  }[] | null;

  @Column({
    type: 'jsonb',
    nullable: true,
    name: 'booking_rules',
  })
  bookingRules: {
    minDurationMinutes?: number;
    maxDurationMinutes?: number;
    advanceBookingDays?: number;
    bufferMinutes?: number;
    cancellationPolicyId?: string;
  } | null;

  @Column({ type: 'text', array: true, default: () => `'{}'`, name: 'amenities' })
  amenities: string[];

  @Column({ type: 'text', array: true, default: () => `'{}'`, name: 'image_urls' })
  imageUrls: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ default: true, name: 'is_bookable' })
  isBookable: boolean;

  @Column({ name: 'salto_lock_id', length: 255, nullable: true })
  saltoLockId: string | null;

  @OneToMany(() => Booking, (booking) => booking.resource)
  bookings: Booking[];
}
