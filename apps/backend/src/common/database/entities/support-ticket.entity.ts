import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Location } from './location.entity';

export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING_ON_USER = 'waiting_on_user',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum TicketCategory {
  FACILITY_ISSUE = 'facility_issue',
  BOOKING_ISSUE = 'booking_issue',
  PAYMENT_ISSUE = 'payment_issue',
  ACCESS_ISSUE = 'access_issue',
  GENERAL_INQUIRY = 'general_inquiry',
  FEEDBACK = 'feedback',
  OTHER = 'other',
}

@Entity('support_tickets')
export class SupportTicket extends BaseEntity {
  @Column({ name: 'ticket_number', length: 20, unique: true })
  ticketNumber: string;

  @Index()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'location_id', type: 'uuid', nullable: true })
  locationId: string | null;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'location_id' })
  location: Location | null;

  @Column({ length: 255 })
  subject: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: TicketCategory })
  category: TicketCategory;

  @Column({ type: 'enum', enum: TicketPriority, default: TicketPriority.MEDIUM })
  priority: TicketPriority;

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.OPEN })
  status: TicketStatus;

  @Column({ name: 'assigned_to', type: 'uuid', nullable: true })
  assignedTo: string | null;

  @Column({ name: 'resource_id', type: 'uuid', nullable: true })
  resourceId: string | null;

  @Column({ name: 'image_urls', type: 'text', array: true, default: () => `'{}'` })
  imageUrls: string[];

  @Column({
    type: 'jsonb',
    default: () => `'[]'`,
  })
  messages: Array<{
    authorId: string;
    authorRole: string;
    message: string;
    imageUrls?: string[];
    createdAt: string;
  }>;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;

  @Column({ name: 'resolved_by', type: 'uuid', nullable: true })
  resolvedBy: string | null;

  @Column({ type: 'int', nullable: true })
  rating: number | null;

  @Column({ name: 'rating_comment', type: 'text', nullable: true })
  ratingComment: string | null;
}
