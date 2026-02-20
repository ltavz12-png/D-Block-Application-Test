import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import {
  Product,
  ProductType,
  BillingPeriod,
} from '@/common/database/entities/product.entity';
import { RateCode } from '@/common/database/entities/rate-code.entity';

// ---------------------------------------------------------------------------
// Helpers & mock factories
// ---------------------------------------------------------------------------

const mockUserId = 'user-0001-0001-0001-000000000001';
const LOCATION_ID = 'loc-stamba-0001-0001-000000000001';
const PRODUCT_ID = 'prod-0001-0001-0001-000000000001';
const RATE_CODE_ID = 'rate-0001-0001-0001-000000000001';

function createMockProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: PRODUCT_ID,
    name: 'Monthly Coworking Pass',
    nameKa: null,
    description: 'Unlimited access to hot desks',
    descriptionKa: null,
    productType: ProductType.COWORKING_PASS,
    billingPeriod: BillingPeriod.MONTHLY,
    locationId: LOCATION_ID,
    isActive: true,
    sortOrder: 1,
    rateCodes: [],
    location: undefined as any,
    createdBy: mockUserId,
    updatedBy: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    deletedAt: null as any,
    ...overrides,
  } as Product;
}

function createMockRateCode(overrides: Partial<RateCode> = {}): RateCode {
  return {
    id: RATE_CODE_ID,
    productId: PRODUCT_ID,
    code: 'STANDARD',
    name: 'Standard Rate',
    amount: 350,
    currency: 'GEL',
    isActive: true,
    conditions: null,
    product: undefined as any,
    createdBy: mockUserId,
    updatedBy: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    deletedAt: null as any,
    ...overrides,
  } as RateCode;
}

// ---------------------------------------------------------------------------
// Query builder mock factory
// ---------------------------------------------------------------------------

function createMockQueryBuilder(returnData?: any) {
  const qb: Record<string, jest.Mock> = {};
  const methods = [
    'leftJoinAndSelect',
    'where',
    'andWhere',
    'orderBy',
    'addOrderBy',
    'skip',
    'take',
    'limit',
  ];

  for (const method of methods) {
    qb[method] = jest.fn().mockReturnThis();
  }

  qb['getManyAndCount'] = jest.fn().mockResolvedValue(returnData ?? [[], 0]);
  qb['getMany'] = jest.fn().mockResolvedValue(returnData?.[0] ?? []);
  qb['getOne'] = jest.fn().mockResolvedValue(returnData ?? null);

  return qb;
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('ProductsService', () => {
  let service: ProductsService;
  let productRepo: Record<string, jest.Mock>;
  let rateCodeRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    productRepo = {
      create: jest.fn((dto) => ({ ...dto })),
      save: jest.fn((entity) =>
        Promise.resolve({ ...entity, id: entity.id || PRODUCT_ID }),
      ),
      findOne: jest.fn(),
      find: jest.fn(),
      softRemove: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn(),
    };

    rateCodeRepo = {
      create: jest.fn((dto) => ({ ...dto })),
      save: jest.fn((entity) =>
        Promise.resolve({ ...entity, id: entity.id || RATE_CODE_ID }),
      ),
      findOne: jest.fn(),
      find: jest.fn(),
      softRemove: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: productRepo },
        { provide: getRepositoryToken(RateCode), useValue: rateCodeRepo },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  // =========================================================================
  // Products CRUD
  // =========================================================================

  describe('findAll', () => {
    it('should return paginated results with defaults', async () => {
      const products = [createMockProduct()];
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([products, 1]);
      productRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.findAll({});

      expect(result).toEqual({ data: products, total: 1, page: 1, limit: 20 });
    });

    it('should filter by productType', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      productRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ productType: ProductType.COWORKING_PASS } as any);

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'product.productType = :productType',
        { productType: ProductType.COWORKING_PASS },
      );
    });

    it('should filter by locationId', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      productRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ locationId: LOCATION_ID } as any);

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'product.locationId = :locationId',
        { locationId: LOCATION_ID },
      );
    });

    it('should filter by isActive', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      productRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ isActive: true } as any);

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'product.isActive = :isActive',
        { isActive: true },
      );
    });

    it('should filter by billingPeriod', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      productRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({
        billingPeriod: BillingPeriod.MONTHLY,
      } as any);

      expect(qb['andWhere']).toHaveBeenCalledWith(
        'product.billingPeriod = :billingPeriod',
        { billingPeriod: BillingPeriod.MONTHLY },
      );
    });

    it('should apply search filter on name, description, nameKa', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      productRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({ search: 'coworking' } as any);

      expect(qb['andWhere']).toHaveBeenCalledWith(
        '(product.name ILIKE :search OR product.description ILIKE :search OR product.nameKa ILIKE :search)',
        { search: '%coworking%' },
      );
    });

    it('should order by sortOrder ASC, createdAt DESC', async () => {
      const qb = createMockQueryBuilder();
      qb['getManyAndCount'].mockResolvedValueOnce([[], 0]);
      productRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findAll({});

      expect(qb['orderBy']).toHaveBeenCalledWith('product.sortOrder', 'ASC');
      expect(qb['addOrderBy']).toHaveBeenCalledWith(
        'product.createdAt',
        'DESC',
      );
    });
  });

  describe('findById', () => {
    it('should return product with rateCodes and location', async () => {
      productRepo.findOne.mockResolvedValueOnce(createMockProduct());

      const result = await service.findById(PRODUCT_ID);

      expect(result.id).toBe(PRODUCT_ID);
      expect(productRepo.findOne).toHaveBeenCalledWith({
        where: { id: PRODUCT_ID },
        relations: ['rateCodes', 'location'],
      });
    });

    it('should throw NotFoundException when not found', async () => {
      productRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.findById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findActiveByLocation', () => {
    it('should return active products for a location', async () => {
      productRepo.find.mockResolvedValueOnce([createMockProduct()]);

      const result = await service.findActiveByLocation(LOCATION_ID);

      expect(result).toHaveLength(1);
      expect(productRepo.find).toHaveBeenCalledWith({
        where: { locationId: LOCATION_ID, isActive: true },
        relations: ['rateCodes'],
        order: { sortOrder: 'ASC', createdAt: 'DESC' },
      });
    });
  });

  describe('findActiveByType', () => {
    it('should return active products of a specific type', async () => {
      productRepo.find.mockResolvedValueOnce([createMockProduct()]);

      const result = await service.findActiveByType(
        ProductType.COWORKING_PASS,
      );

      expect(result).toHaveLength(1);
      expect(productRepo.find).toHaveBeenCalledWith({
        where: {
          productType: ProductType.COWORKING_PASS,
          isActive: true,
        },
        relations: ['rateCodes'],
        order: { sortOrder: 'ASC', createdAt: 'DESC' },
      });
    });
  });

  describe('create', () => {
    it('should create a product with createdBy', async () => {
      const dto = {
        name: 'Monthly Pass',
        productType: ProductType.COWORKING_PASS,
        billingPeriod: BillingPeriod.MONTHLY,
      };

      productRepo.save.mockResolvedValueOnce({
        ...dto,
        id: PRODUCT_ID,
        createdBy: mockUserId,
      });

      const result = await service.create(dto as any, mockUserId);

      expect(productRepo.create).toHaveBeenCalledWith({
        ...dto,
        createdBy: mockUserId,
      });
      expect(result.createdBy).toBe(mockUserId);
    });
  });

  describe('update', () => {
    it('should update product fields and set updatedBy', async () => {
      productRepo.findOne.mockResolvedValueOnce(createMockProduct());
      productRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.update(
        PRODUCT_ID,
        { name: 'Updated Pass', sortOrder: 5 } as any,
        mockUserId,
      );

      expect(result.name).toBe('Updated Pass');
      expect(result.sortOrder).toBe(5);
      expect(result.updatedBy).toBe(mockUserId);
    });

    it('should throw NotFoundException when product not found', async () => {
      productRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.update('non-existent', { name: 'X' } as any, mockUserId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-remove a product', async () => {
      productRepo.findOne.mockResolvedValueOnce(createMockProduct());

      await service.remove(PRODUCT_ID);

      expect(productRepo.softRemove).toHaveBeenCalled();
    });

    it('should throw NotFoundException when product not found', async () => {
      productRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // =========================================================================
  // Rate Codes
  // =========================================================================

  describe('findRateCodesByProduct', () => {
    it('should return active rate codes for a product', async () => {
      rateCodeRepo.find.mockResolvedValueOnce([createMockRateCode()]);

      const result = await service.findRateCodesByProduct(PRODUCT_ID);

      expect(result).toHaveLength(1);
      expect(rateCodeRepo.find).toHaveBeenCalledWith({
        where: { productId: PRODUCT_ID, isActive: true },
        order: { amount: 'ASC' },
      });
    });
  });

  describe('findRateCodeById', () => {
    it('should return rate code with product relation', async () => {
      rateCodeRepo.findOne.mockResolvedValueOnce(createMockRateCode());

      const result = await service.findRateCodeById(RATE_CODE_ID);

      expect(result.id).toBe(RATE_CODE_ID);
    });

    it('should throw NotFoundException when not found', async () => {
      rateCodeRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.findRateCodeById('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createRateCode', () => {
    it('should create rate code after verifying product exists', async () => {
      productRepo.findOne.mockResolvedValueOnce(createMockProduct());
      rateCodeRepo.save.mockResolvedValueOnce(createMockRateCode());

      const dto = {
        productId: PRODUCT_ID,
        code: 'STANDARD',
        name: 'Standard Rate',
        amount: 350,
      };

      const result = await service.createRateCode(dto as any, mockUserId);

      expect(result.id).toBe(RATE_CODE_ID);
      expect(rateCodeRepo.create).toHaveBeenCalledWith({
        ...dto,
        createdBy: mockUserId,
      });
    });

    it('should throw NotFoundException when product does not exist', async () => {
      productRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.createRateCode(
          { productId: 'non-existent' } as any,
          mockUserId,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateRateCode', () => {
    it('should update rate code and set updatedBy', async () => {
      rateCodeRepo.findOne.mockResolvedValueOnce(createMockRateCode());
      rateCodeRepo.save.mockImplementation((entity) =>
        Promise.resolve(entity),
      );

      const result = await service.updateRateCode(
        RATE_CODE_ID,
        { amount: 400 } as any,
        mockUserId,
      );

      expect(result.amount).toBe(400);
      expect(result.updatedBy).toBe(mockUserId);
    });

    it('should throw NotFoundException when rate code not found', async () => {
      rateCodeRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.updateRateCode(
          'non-existent',
          { amount: 400 } as any,
          mockUserId,
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeRateCode', () => {
    it('should soft-remove a rate code', async () => {
      rateCodeRepo.findOne.mockResolvedValueOnce(createMockRateCode());

      await service.removeRateCode(RATE_CODE_ID);

      expect(rateCodeRepo.softRemove).toHaveBeenCalled();
    });

    it('should throw NotFoundException when rate code not found', async () => {
      rateCodeRepo.findOne.mockResolvedValueOnce(null);

      await expect(service.removeRateCode('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // =========================================================================
  // findBestRate
  // =========================================================================

  describe('findBestRate', () => {
    it('should return the cheapest active rate code for a product', async () => {
      const qb = createMockQueryBuilder();
      qb['getOne'].mockResolvedValueOnce(createMockRateCode({ amount: 250 }));
      rateCodeRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.findBestRate(PRODUCT_ID);

      expect(result?.amount).toBe(250);
      expect(qb['orderBy']).toHaveBeenCalledWith('rate.amount', 'ASC');
      expect(qb['limit']).toHaveBeenCalledWith(1);
    });

    it('should return null when no active rate codes exist', async () => {
      const qb = createMockQueryBuilder();
      qb['getOne'].mockResolvedValueOnce(null);
      rateCodeRepo.createQueryBuilder.mockReturnValueOnce(qb);

      const result = await service.findBestRate(PRODUCT_ID);

      expect(result).toBeNull();
    });

    it('should filter by locationId when provided', async () => {
      const qb = createMockQueryBuilder();
      qb['getOne'].mockResolvedValueOnce(createMockRateCode());
      rateCodeRepo.createQueryBuilder.mockReturnValueOnce(qb);

      await service.findBestRate(PRODUCT_ID, LOCATION_ID);

      expect(qb['andWhere']).toHaveBeenCalledWith(
        expect.stringContaining('locationIds'),
        expect.objectContaining({
          locationId: JSON.stringify([LOCATION_ID]),
        }),
      );
    });
  });
});
