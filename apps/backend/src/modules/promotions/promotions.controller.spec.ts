import { Test, TestingModule } from '@nestjs/testing';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';

// ────────────────────────────────────────────────────────────────────────────
// Mock data
// ────────────────────────────────────────────────────────────────────────────

const mockUser = { id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' };

const mockPromotion = {
  id: '11111111-2222-3333-4444-555555555555',
  name: 'Summer Sale',
  description: '20% off all day passes',
  discountType: 'PERCENTAGE',
  discountValue: 20,
  isActive: true,
  startDate: '2025-06-01',
  endDate: '2025-08-31',
  createdById: mockUser.id,
  createdAt: new Date().toISOString(),
};

const mockPromotionsList = {
  data: [mockPromotion],
  total: 1,
  page: 1,
  limit: 20,
};

const mockPromoCode = {
  id: '22222222-3333-4444-5555-666666666666',
  code: 'SUMMER20',
  promotionId: mockPromotion.id,
  maxUses: 100,
  usedCount: 5,
  isActive: true,
};

const mockOverallStats = {
  totalPromotions: 10,
  activePromotions: 3,
  totalRedemptions: 150,
  totalDiscount: 3500,
};

const mockPromotionStats = {
  totalCodes: 20,
  activeCodes: 15,
  totalRedemptions: 45,
  totalDiscount: 900,
};

const mockValidation = {
  valid: true,
  discountType: 'PERCENTAGE',
  discountValue: 20,
  promotionName: 'Summer Sale',
};

// ────────────────────────────────────────────────────────────────────────────
// Mock service
// ────────────────────────────────────────────────────────────────────────────

const mockPromotionsService = {
  findAll: jest.fn().mockResolvedValue(mockPromotionsList),
  getOverallStats: jest.fn().mockResolvedValue(mockOverallStats),
  createPromotion: jest.fn().mockResolvedValue(mockPromotion),
  validatePromoCode: jest.fn().mockResolvedValue(mockValidation),
  deactivatePromoCode: jest.fn().mockResolvedValue({ ...mockPromoCode, isActive: false }),
  findById: jest.fn().mockResolvedValue(mockPromotion),
  updatePromotion: jest.fn().mockResolvedValue(mockPromotion),
  toggleActive: jest.fn().mockResolvedValue({ ...mockPromotion, isActive: false }),
  deletePromotion: jest.fn().mockResolvedValue(undefined),
  getPromotionStats: jest.fn().mockResolvedValue(mockPromotionStats),
  findPromoCodesByPromotion: jest.fn().mockResolvedValue([mockPromoCode]),
  createPromoCode: jest.fn().mockResolvedValue(mockPromoCode),
  generatePromoCodes: jest.fn().mockResolvedValue({ generated: 10 }),
};

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe('PromotionsController', () => {
  let controller: PromotionsController;
  let service: PromotionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PromotionsController],
      providers: [
        { provide: PromotionsService, useValue: mockPromotionsService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PromotionsController>(PromotionsController);
    service = module.get<PromotionsService>(PromotionsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ── GET / ────────────────────────────────────────────────────────────────

  describe('GET / (findAll)', () => {
    it('should call promotionsService.findAll with query', async () => {
      const query = { page: 1, limit: 20 } as any;
      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockPromotionsList);
    });

    it('should handle empty query', async () => {
      await controller.findAll({} as any);
      expect(service.findAll).toHaveBeenCalledWith({});
    });
  });

  // ── GET /stats ───────────────────────────────────────────────────────────

  describe('GET /stats (getOverallStats)', () => {
    it('should call promotionsService.getOverallStats', async () => {
      const result = await controller.getOverallStats();

      expect(service.getOverallStats).toHaveBeenCalled();
      expect(result).toEqual(mockOverallStats);
    });
  });

  // ── POST / ───────────────────────────────────────────────────────────────

  describe('POST / (createPromotion)', () => {
    it('should call promotionsService.createPromotion with userId and dto', async () => {
      const dto = {
        name: 'Winter Promo',
        discountType: 'FIXED',
        discountValue: 50,
        startDate: '2025-12-01',
        endDate: '2026-01-31',
      } as any;

      const result = await controller.createPromotion(mockUser, dto);

      expect(service.createPromotion).toHaveBeenCalledWith(mockUser.id, dto);
      expect(result).toEqual(mockPromotion);
    });
  });

  // ── POST /validate-code ──────────────────────────────────────────────────

  describe('POST /validate-code (validatePromoCode)', () => {
    it('should call promotionsService.validatePromoCode with dto', async () => {
      const dto = { code: 'SUMMER20', bookingAmount: 100 } as any;
      const result = await controller.validatePromoCode(dto);

      expect(service.validatePromoCode).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockValidation);
    });
  });

  // ── POST /codes/:codeId/deactivate ───────────────────────────────────────

  describe('POST /codes/:codeId/deactivate (deactivatePromoCode)', () => {
    it('should call promotionsService.deactivatePromoCode with codeId', async () => {
      const result = await controller.deactivatePromoCode(mockPromoCode.id);

      expect(service.deactivatePromoCode).toHaveBeenCalledWith(mockPromoCode.id);
      expect(result).toEqual(
        expect.objectContaining({ isActive: false }),
      );
    });
  });

  // ── GET /:id ─────────────────────────────────────────────────────────────

  describe('GET /:id (findById)', () => {
    it('should call promotionsService.findById with id', async () => {
      const result = await controller.findById(mockPromotion.id);

      expect(service.findById).toHaveBeenCalledWith(mockPromotion.id);
      expect(result).toEqual(mockPromotion);
    });
  });

  // ── PATCH /:id ───────────────────────────────────────────────────────────

  describe('PATCH /:id (updatePromotion)', () => {
    it('should call promotionsService.updatePromotion with id, userId and dto', async () => {
      const dto = { name: 'Updated Promotion' } as any;
      const result = await controller.updatePromotion(
        mockPromotion.id,
        mockUser,
        dto,
      );

      expect(service.updatePromotion).toHaveBeenCalledWith(
        mockPromotion.id,
        mockUser.id,
        dto,
      );
      expect(result).toEqual(mockPromotion);
    });
  });

  // ── POST /:id/toggle-active ──────────────────────────────────────────────

  describe('POST /:id/toggle-active (toggleActive)', () => {
    it('should call promotionsService.toggleActive with id', async () => {
      const result = await controller.toggleActive(mockPromotion.id);

      expect(service.toggleActive).toHaveBeenCalledWith(mockPromotion.id);
      expect(result).toEqual(
        expect.objectContaining({ isActive: false }),
      );
    });
  });

  // ── DELETE /:id ──────────────────────────────────────────────────────────

  describe('DELETE /:id (deletePromotion)', () => {
    it('should call promotionsService.deletePromotion with id', async () => {
      const result = await controller.deletePromotion(mockPromotion.id);

      expect(service.deletePromotion).toHaveBeenCalledWith(mockPromotion.id);
      expect(result).toBeUndefined();
    });
  });

  // ── GET /:id/stats ───────────────────────────────────────────────────────

  describe('GET /:id/stats (getPromotionStats)', () => {
    it('should call promotionsService.getPromotionStats with id', async () => {
      const result = await controller.getPromotionStats(mockPromotion.id);

      expect(service.getPromotionStats).toHaveBeenCalledWith(mockPromotion.id);
      expect(result).toEqual(mockPromotionStats);
    });
  });

  // ── GET /:id/codes ───────────────────────────────────────────────────────

  describe('GET /:id/codes (findPromoCodesByPromotion)', () => {
    it('should call promotionsService.findPromoCodesByPromotion with id', async () => {
      const result = await controller.findPromoCodesByPromotion(
        mockPromotion.id,
      );

      expect(service.findPromoCodesByPromotion).toHaveBeenCalledWith(
        mockPromotion.id,
      );
      expect(result).toEqual([mockPromoCode]);
    });
  });

  // ── POST /:id/codes ─────────────────────────────────────────────────────

  describe('POST /:id/codes (createPromoCode)', () => {
    it('should set promotionId from path param and call promotionsService.createPromoCode', async () => {
      const dto = {
        code: 'NEWCODE',
        maxUses: 50,
      } as any;

      const result = await controller.createPromoCode(mockPromotion.id, dto);

      // The controller sets dto.promotionId = id
      expect(dto.promotionId).toBe(mockPromotion.id);
      expect(service.createPromoCode).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockPromoCode);
    });
  });

  // ── POST /:id/codes/generate ─────────────────────────────────────────────

  describe('POST /:id/codes/generate (generatePromoCodes)', () => {
    it('should set promotionId from path param and call promotionsService.generatePromoCodes', async () => {
      const dto = {
        count: 10,
        prefix: 'PROMO',
      } as any;

      const result = await controller.generatePromoCodes(
        mockPromotion.id,
        dto,
      );

      // The controller sets dto.promotionId = id
      expect(dto.promotionId).toBe(mockPromotion.id);
      expect(service.generatePromoCodes).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ generated: 10 });
    });
  });
});
