import { Entity, Column, Index, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum AccessMethod {
  BLE = 'ble',
  NFC = 'nfc',
  PIN = 'pin',
  QR_CODE = 'qr_code',
  MANUAL = 'manual',
}

export enum AccessDirection {
  ENTRY = 'entry',
  EXIT = 'exit',
}

@Entity('access_logs')
export class AccessLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Index()
  @Column({ name: 'location_id', type: 'uuid' })
  locationId: string;

  @Column({ name: 'resource_id', type: 'uuid', nullable: true })
  resourceId: string | null;

  @Column({ name: 'door_id', length: 255, nullable: true })
  doorId: string | null;

  @Column({ type: 'enum', enum: AccessMethod })
  method: AccessMethod;

  @Column({ type: 'enum', enum: AccessDirection, nullable: true })
  direction: AccessDirection | null;

  @Column({ default: true })
  granted: boolean;

  @Column({ name: 'denial_reason', type: 'text', nullable: true })
  denialReason: string | null;

  @Index()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'salto_event_id', length: 255, nullable: true })
  saltoEventId: string | null;
}
