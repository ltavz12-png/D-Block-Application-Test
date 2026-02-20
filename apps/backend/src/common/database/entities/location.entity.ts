import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntityWithCreator } from './base.entity';
import { Resource } from './resource.entity';

@Entity('locations')
export class Location extends BaseEntityWithCreator {
  @Column({ length: 255 })
  name: string;

  @Column({ length: 100 })
  city: string;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ length: 20, nullable: true })
  timezone: string | null;

  @Column({ length: 10, default: 'GEL' })
  currency: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude: number | null;

  @Column({ length: 20, nullable: true })
  phone: string | null;

  @Column({ length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'jsonb', nullable: true, name: 'operating_hours' })
  operatingHours: Record<string, { open: string; close: string }> | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ type: 'text', nullable: true, name: 'image_url' })
  imageUrl: string | null;

  @OneToMany(() => Resource, (resource) => resource.location)
  resources: Resource[];
}
