import { Test, TestingModule } from '@nestjs/testing';
import { ModuleMetadata } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Creates a NestJS testing module with common configuration already applied.
 * Wraps Test.createTestingModule with a mock ConfigService by default.
 */
export async function createTestingModule(
  metadata: ModuleMetadata,
): Promise<TestingModule> {
  const moduleBuilder = Test.createTestingModule({
    ...metadata,
    providers: [
      ...(metadata.providers || []),
      {
        provide: ConfigService,
        useValue: createMockConfigService(),
      },
    ],
  });

  return moduleBuilder.compile();
}

/**
 * Returns a mock TypeORM repository with jest.fn() for all common methods.
 * Use with `{ provide: getRepositoryToken(Entity), useValue: mockRepository<Entity>() }`.
 */
export function mockRepository<T = any>(): Record<string, any> {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    softDelete: jest.fn(),
    softRemove: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder()),
    merge: jest.fn(),
    preload: jest.fn(),
    findOneOrFail: jest.fn(),
    findOneByOrFail: jest.fn(),
    insert: jest.fn(),
    upsert: jest.fn(),
    exist: jest.fn(),
    exists: jest.fn(),
    query: jest.fn(),
    clear: jest.fn(),
    increment: jest.fn(),
    decrement: jest.fn(),
    manager: {
      transaction: jest.fn((cb: any) => cb({
        save: jest.fn(),
        remove: jest.fn(),
        findOne: jest.fn(),
      })),
    },
    metadata: {
      columns: [],
      relations: [],
    },
  };
}

/**
 * Returns a mock TypeORM SelectQueryBuilder with chaining methods.
 * All terminal methods (getMany, getOne, etc.) return jest.fn() resolving to sensible defaults.
 */
export function mockQueryBuilder(): Record<string, jest.Mock> {
  const qb: Record<string, jest.Mock> = {} as any;

  // Chaining methods - each returns the query builder itself
  const chainingMethods = [
    'where',
    'andWhere',
    'orWhere',
    'leftJoin',
    'leftJoinAndSelect',
    'innerJoin',
    'innerJoinAndSelect',
    'orderBy',
    'addOrderBy',
    'skip',
    'take',
    'select',
    'addSelect',
    'groupBy',
    'addGroupBy',
    'having',
    'andHaving',
    'limit',
    'offset',
    'setParameter',
    'setParameters',
    'withDeleted',
    'distinctOn',
    'from',
    'subQuery',
  ];

  for (const method of chainingMethods) {
    qb[method] = jest.fn().mockReturnValue(qb);
  }

  // Terminal methods
  qb.getMany = jest.fn().mockResolvedValue([]);
  qb.getManyAndCount = jest.fn().mockResolvedValue([[], 0]);
  qb.getOne = jest.fn().mockResolvedValue(null);
  qb.getCount = jest.fn().mockResolvedValue(0);
  qb.getRawMany = jest.fn().mockResolvedValue([]);
  qb.getRawOne = jest.fn().mockResolvedValue(null);
  qb.execute = jest.fn().mockResolvedValue({ affected: 0 });
  qb.getExists = jest.fn().mockResolvedValue(false);

  return qb;
}

/**
 * Returns a mock ConfigService with common environment variables for D Block Workspace.
 * Override any value by passing an overrides object.
 */
export function createMockConfigService(
  overrides: Record<string, any> = {},
): Partial<ConfigService> {
  const defaults: Record<string, any> = {
    NODE_ENV: 'test',
    PORT: 3000,
    DATABASE_HOST: 'localhost',
    DATABASE_PORT: 5432,
    DATABASE_NAME: 'dblock_test',
    DATABASE_USER: 'test_user',
    DATABASE_PASSWORD: 'test_password',
    JWT_SECRET: 'test-jwt-secret-key',
    JWT_EXPIRATION: '1h',
    JWT_REFRESH_SECRET: 'test-jwt-refresh-secret-key',
    JWT_REFRESH_EXPIRATION: '7d',
    REDIS_HOST: 'localhost',
    REDIS_PORT: 6379,
    SENDGRID_API_KEY: 'SG.test-key',
    SENDGRID_FROM_EMAIL: 'noreply@dblock.ge',
    APP_URL: 'http://localhost:3000',
    FRONTEND_URL: 'http://localhost:4200',
    BOG_MERCHANT_ID: 'test-merchant-id',
    BOG_SECRET: 'test-bog-secret',
    TBC_API_KEY: 'test-tbc-key',
  };

  const config = { ...defaults, ...overrides };

  return {
    get: jest.fn((key: string, defaultValue?: any) => {
      return config[key] !== undefined ? config[key] : defaultValue;
    }),
    getOrThrow: jest.fn((key: string) => {
      if (config[key] === undefined) {
        throw new Error(`Configuration key "${key}" does not exist`);
      }
      return config[key];
    }),
  } as Partial<ConfigService>;
}
