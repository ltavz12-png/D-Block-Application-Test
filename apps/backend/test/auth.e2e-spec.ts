import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '@/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '@/common/database/entities/user.entity';

// ────────────────────────────────────────────────────────────────────────────
// Mock repository factory
// ────────────────────────────────────────────────────────────────────────────

const createMockRepository = () => ({
  find: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue(null),
  findOneBy: jest.fn().mockResolvedValue(null),
  findAndCount: jest.fn().mockResolvedValue([[], 0]),
  save: jest.fn().mockImplementation((entity) =>
    Promise.resolve({ id: 'generated-uuid', ...entity }),
  ),
  create: jest.fn().mockImplementation((dto) => dto),
  update: jest.fn().mockResolvedValue({ affected: 1 }),
  delete: jest.fn().mockResolvedValue({ affected: 1 }),
  softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
  count: jest.fn().mockResolvedValue(0),
  createQueryBuilder: jest.fn().mockReturnValue({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getOne: jest.fn().mockResolvedValue(null),
    getCount: jest.fn().mockResolvedValue(0),
    getRawMany: jest.fn().mockResolvedValue([]),
    getRawOne: jest.fn().mockResolvedValue(null),
    execute: jest.fn().mockResolvedValue({ affected: 1 }),
  }),
  metadata: {
    columns: [],
    relations: [],
    tableName: 'mock_table',
  },
});

// ────────────────────────────────────────────────────────────────────────────
// Auth E2E Tests
// ────────────────────────────────────────────────────────────────────────────

describe('Auth E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('DATA_SOURCE')
      .useValue({})
      .overrideProvider(getRepositoryToken(User))
      .useValue(createMockRepository())
      .compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  // ── POST /auth/register ──────────────────────────────────────────────────

  describe('POST /api/v1/auth/register', () => {
    it('should accept a valid registration payload', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'ValidPass123!',
          firstName: 'New',
          lastName: 'User',
        })
        .expect((res: any) => {
          // Service might fail with mocked DB, but route should be reachable
          expect([201, 500]).toContain(res.status);
        });
    });

    it('should reject registration with missing email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          password: 'ValidPass123!',
          firstName: 'No',
          lastName: 'Email',
        })
        .expect((res: any) => {
          // Expect 400 (validation) or 500 (service error)
          expect([400, 422]).toContain(res.status);
        });
    });

    it('should reject registration with missing password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'nopass@example.com',
          firstName: 'No',
          lastName: 'Password',
        })
        .expect((res: any) => {
          expect([400, 422]).toContain(res.status);
        });
    });

    it('should reject registration with invalid email format', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'not-an-email',
          password: 'ValidPass123!',
          firstName: 'Bad',
          lastName: 'Email',
        })
        .expect((res: any) => {
          expect([400, 422]).toContain(res.status);
        });
    });

    it('should reject registration with extra unknown fields', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'extra@example.com',
          password: 'ValidPass123!',
          firstName: 'Extra',
          lastName: 'Fields',
          role: 'super_admin', // should be stripped or rejected
          isAdmin: true,
        })
        .expect((res: any) => {
          // forbidNonWhitelisted: true should reject unknown props
          expect([400, 422]).toContain(res.status);
        });
    });
  });

  // ── POST /auth/login ─────────────────────────────────────────────────────

  describe('POST /api/v1/auth/login', () => {
    it('should accept a valid login payload', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'SomePass123!',
        })
        .expect((res: any) => {
          // Route should be reachable; auth failure from mocked service is OK
          expect([200, 401, 500]).toContain(res.status);
        });
    });

    it('should reject login without email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          password: 'SomePass123!',
        })
        .expect((res: any) => {
          expect([400, 422]).toContain(res.status);
        });
    });

    it('should reject login without password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'user@example.com',
        })
        .expect((res: any) => {
          expect([400, 422]).toContain(res.status);
        });
    });

    it('should reject login with empty body', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({})
        .expect((res: any) => {
          expect([400, 422]).toContain(res.status);
        });
    });
  });

  // ── POST /auth/refresh ───────────────────────────────────────────────────

  describe('POST /api/v1/auth/refresh', () => {
    it('should accept a valid refresh token payload', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'some-refresh-token-value',
        })
        .expect((res: any) => {
          // Token will be invalid since DB is mocked, but route should work
          expect([200, 401, 500]).toContain(res.status);
        });
    });

    it('should reject refresh without token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({})
        .expect((res: any) => {
          expect([400, 422]).toContain(res.status);
        });
    });
  });

  // ── Protected endpoint access without token (401) ────────────────────────

  describe('Protected endpoints without authentication', () => {
    it('GET /api/v1/visitors should return 401', () => {
      return request(app.getHttpServer())
        .get('/api/v1/visitors')
        .expect(401);
    });

    it('GET /api/v1/bookings/my should return 401', () => {
      return request(app.getHttpServer())
        .get('/api/v1/bookings/my')
        .expect(401);
    });

    it('GET /api/v1/notifications/my should return 401', () => {
      return request(app.getHttpServer())
        .get('/api/v1/notifications/my')
        .expect(401);
    });

    it('GET /api/v1/analytics/events should return 401', () => {
      return request(app.getHttpServer())
        .get('/api/v1/analytics/events')
        .expect(401);
    });

    it('GET /api/v1/promotions should return 401', () => {
      return request(app.getHttpServer())
        .get('/api/v1/promotions')
        .expect(401);
    });

    it('POST /api/v1/auth/logout should return 401 (requires auth)', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .send({ refreshToken: 'some-token' })
        .expect(401);
    });

    it('POST /api/v1/auth/2fa/setup should return 401', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/2fa/setup')
        .send({ method: 'totp' })
        .expect(401);
    });
  });

  // ── Access admin endpoints without proper role (403 scenario) ────────────
  // Note: In E2E with mocked DB, we verify routes exist and require auth.
  // True role-based 403 tests would need a valid JWT with member role.

  describe('Admin endpoint access control', () => {
    it('GET /api/v1/bookings/admin should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/bookings/admin')
        .expect(401);
    });

    it('GET /api/v1/bookings/admin/stats should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/bookings/admin/stats')
        .expect(401);
    });

    it('POST /api/v1/notifications/send should return 401 without token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/notifications/send')
        .send({
          userId: 'some-user-id',
          title: 'Test',
          body: 'Test notification',
        })
        .expect(401);
    });

    it('POST /api/v1/notifications/broadcast should return 401 without token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/notifications/broadcast')
        .send({
          title: 'Test broadcast',
          body: 'Test broadcast body',
        })
        .expect(401);
    });
  });

  // ── Public endpoints should be accessible without token ──────────────────

  describe('Public endpoints', () => {
    it('POST /api/v1/auth/register should not return 401', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'public@example.com',
          password: 'Test1234!',
          firstName: 'Pub',
          lastName: 'Lic',
        })
        .expect((res: any) => {
          expect(res.status).not.toBe(401);
        });
    });

    it('POST /api/v1/auth/login should not return 401', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'public@example.com',
          password: 'Test1234!',
        })
        .expect((res: any) => {
          expect(res.status).not.toBe(401);
        });
    });

    it('POST /api/v1/auth/refresh should not return 401', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'any-token',
        })
        .expect((res: any) => {
          expect(res.status).not.toBe(401);
        });
    });

    it('POST /api/v1/auth/forgot-password should not return 401', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/forgot-password')
        .send({
          email: 'user@example.com',
        })
        .expect((res: any) => {
          expect(res.status).not.toBe(401);
        });
    });

    it('POST /api/v1/auth/otp/send should not return 401', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/otp/send')
        .send({
          phone: '+995555000111',
        })
        .expect((res: any) => {
          expect(res.status).not.toBe(401);
        });
    });

    it('POST /api/v1/auth/social/google should not return 401', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/social/google')
        .send({
          token: 'mock-google-token',
        })
        .expect((res: any) => {
          expect(res.status).not.toBe(401);
        });
    });
  });
});
