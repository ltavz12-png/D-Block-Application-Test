import { Entity, Column, Index, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'entity_type', length: 100 })
  entityType: string;

  @Column({ name: 'entity_id', type: 'uuid' })
  entityId: string;

  @Column({ length: 50 })
  action: string;

  @Index()
  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId: string | null;

  @Column({ name: 'actor_role', type: 'varchar', length: 50, nullable: true })
  actorRole: string | null;

  @Column({ type: 'jsonb', nullable: true, name: 'old_values' })
  oldValues: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true, name: 'new_values' })
  newValues: Record<string, any> | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ name: 'correlation_id', type: 'uuid', nullable: true })
  correlationId: string | null;

  @Index()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
