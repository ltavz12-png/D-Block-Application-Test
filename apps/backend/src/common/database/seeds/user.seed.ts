import { DataSource } from 'typeorm';
import { User, UserRole, UserStatus } from '../entities/user.entity';
import * as bcrypt from 'bcrypt';

export async function seedUsers(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(User);

  const adminEmail = 'admin@dblock.ge';
  const existing = await repo.findOne({ where: { email: adminEmail } });
  if (existing) return;

  const passwordHash = await bcrypt.hash('Admin123!', 12);

  await repo.save(
    repo.create({
      email: adminEmail,
      passwordHash,
      firstName: 'Admin',
      lastName: 'DBlock',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      preferredLanguage: 'en',
    }),
  );

  const testHash = await bcrypt.hash('Test1234!', 12);
  await repo.save(
    repo.create({
      email: 'user@dblock.ge',
      passwordHash: testHash,
      firstName: 'Test',
      lastName: 'User',
      phone: '+995555123456',
      role: UserRole.MEMBER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      preferredLanguage: 'en',
    }),
  );
}
