import {
  Entity,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserAuthProvider } from './user-auth-provider.entity';
import { Booking } from './booking.entity';
import { UserPass } from './user-pass.entity';
import { Company } from './company.entity';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  FINANCE_ADMIN = 'finance_admin',
  LOCATION_MANAGER = 'location_manager',
  RECEPTION_STAFF = 'reception_staff',
  MARKETING_ADMIN = 'marketing_admin',
  SUPPORT_AGENT = 'support_agent',
  COMPANY_ADMIN = 'company_admin',
  COMPANY_EMPLOYEE = 'company_employee',
  MEMBER = 'member',
}

export enum UserStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DEACTIVATED = 'deactivated',
  PENDING_VERIFICATION = 'pending_verification',
}

@Entity('users')
export class User extends BaseEntity {
  @Index()
  @Column({ length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true, unique: true })
  phone: string | null;

  @Column({ name: 'password_hash', type: 'text', nullable: true })
  passwordHash: string | null;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ name: 'profile_image_url', type: 'text', nullable: true })
  profileImageUrl: string | null;

  @Column({
    name: 'preferred_language',
    length: 5,
    default: 'en',
  })
  preferredLanguage: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.MEMBER,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING_VERIFICATION,
  })
  status: UserStatus;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'phone_verified', default: false })
  phoneVerified: boolean;

  @Column({ name: 'two_factor_enabled', default: false })
  twoFactorEnabled: boolean;

  @Column({ name: 'two_factor_secret', type: 'text', nullable: true })
  twoFactorSecret: string | null;

  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId: string | null;

  @ManyToOne(() => Company, { nullable: true })
  @JoinColumn({ name: 'company_id' })
  company: Company | null;

  @Column({ name: 'location_id', type: 'uuid', nullable: true })
  locationId: string | null;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date | null;

  @Column({
    name: 'notification_preferences',
    type: 'jsonb',
    default: () => `'{"push": true, "email": true, "sms": false, "marketing": false}'`,
  })
  notificationPreferences: {
    push: boolean;
    email: boolean;
    sms: boolean;
    marketing: boolean;
  };

  @Column({
    name: 'consent_log',
    type: 'jsonb',
    default: () => `'[]'`,
  })
  consentLog: Array<{
    type: string;
    accepted: boolean;
    version: string;
    timestamp: string;
    ip: string;
  }>;

  @OneToMany(() => UserAuthProvider, (provider) => provider.user)
  authProviders: UserAuthProvider[];

  @OneToMany(() => Booking, (booking) => booking.user)
  bookings: Booking[];

  @OneToMany(() => UserPass, (pass) => pass.user)
  passes: UserPass[];

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
