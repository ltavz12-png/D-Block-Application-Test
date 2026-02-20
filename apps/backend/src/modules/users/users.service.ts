import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from '@/common/database/entities/user.entity';
import { UserAuthProvider, AuthProvider } from '@/common/database/entities/user-auth-provider.entity';
import { SocialProfile } from '@/modules/auth/dto/social-auth.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserAuthProvider)
    private readonly authProviderRepo: Repository<UserAuthProvider>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email: email.toLowerCase() } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { phone } });
  }

  async createUser(data: {
    email: string;
    passwordHash: string | null;
    firstName: string;
    lastName: string;
    phone?: string;
    preferredLanguage?: string;
    emailVerified?: boolean;
    status?: UserStatus;
  }): Promise<User> {
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const user = this.userRepo.create({
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null,
      preferredLanguage: data.preferredLanguage || 'en',
      emailVerified: data.emailVerified || false,
      status: data.status || UserStatus.PENDING_VERIFICATION,
    });

    return this.userRepo.save(user);
  }

  async findOrCreateBySocialProfile(profile: SocialProfile): Promise<User> {
    const providerEnum = profile.provider as AuthProvider;

    // Check if provider link exists
    const existingProvider = await this.authProviderRepo.findOne({
      where: { provider: providerEnum, providerId: profile.providerId },
      relations: ['user'],
    });

    if (existingProvider) {
      return existingProvider.user;
    }

    // Check if user with same email exists (account linking)
    let user = await this.findByEmail(profile.email);

    if (!user) {
      user = this.userRepo.create({
        email: profile.email.toLowerCase(),
        passwordHash: null,
        firstName: profile.firstName,
        lastName: profile.lastName,
        profileImageUrl: profile.profileImageUrl || null,
        emailVerified: true,
        status: UserStatus.ACTIVE,
      });
      user = await this.userRepo.save(user);
    }

    // Link the social provider
    const authProvider = this.authProviderRepo.create({
      userId: user.id,
      provider: providerEnum,
      providerId: profile.providerId,
    });
    await this.authProviderRepo.save(authProvider);

    return user;
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.userRepo.update(userId, { passwordHash });
  }

  async verifyEmail(userId: string): Promise<void> {
    await this.userRepo.update(userId, {
      emailVerified: true,
      status: UserStatus.ACTIVE,
    });
  }

  async verifyPhone(userId: string, phone: string): Promise<void> {
    await this.userRepo.update(userId, { phone, phoneVerified: true });
  }

  async update2faSecret(userId: string, secret: string | null): Promise<void> {
    await this.userRepo.update(userId, {
      twoFactorSecret: secret,
      twoFactorEnabled: secret !== null,
    });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepo.update(userId, { lastLoginAt: new Date() });
  }
}
