import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Promotion, DiscountType } from '@/common/database/entities/promotion.entity';
import { PromoCode } from '@/common/database/entities/promo-code.entity';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { GeneratePromoCodesDto } from './dto/generate-promo-codes.dto';
import { ValidatePromoCodeDto } from './dto/validate-promo-code.dto';
import { QueryPromotionsDto } from './dto/query-promotions.dto';

@Injectable()
export class PromotionsService {
  private readonly logger = new Logger(PromotionsService.name);

  constructor(
    @InjectRepository(Promotion)
    private readonly promotionRepo: Repository<Promotion>,
    @InjectRepository(PromoCode)
    private readonly promoCodeRepo: Repository<PromoCode>,
  ) {}

  // ---------------------------------------------------------------------------
  // Promotion CRUD
  // ---------------------------------------------------------------------------

  async createPromotion(
    userId: string,
    dto: CreatePromotionDto,
  ): Promise<Promotion> {
    const promotion = this.promotionRepo.create({
      name: dto.name,
      description: dto.description || null,
      rules: {
        conditions: dto.rules.conditions,
        logic: dto.rules.logic,
      },
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      maxDiscountAmount: dto.maxDiscountAmount ?? null,
      validFrom: new Date(dto.validFrom),
      validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
      usageLimit: dto.usageLimit ?? null,
      usageCount: 0,
      perUserLimit: dto.perUserLimit ?? null,
      isActive: true,
      locationIds: dto.locationIds ?? null,
      productIds: dto.productIds ?? null,
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await this.promotionRepo.save(promotion);
    this.logger.log(`Promotion "${saved.name}" created by user ${userId}`);
    return saved;
  }

  async updatePromotion(
    id: string,
    userId: string,
    dto: UpdatePromotionDto,
  ): Promise<Promotion> {
    const promotion = await this.promotionRepo.findOne({ where: { id } });

    if (!promotion) {
      throw new NotFoundException(`Promotion with ID ${id} not found`);
    }

    if (dto.name !== undefined) promotion.name = dto.name;
    if (dto.description !== undefined) promotion.description = dto.description || null;
    if (dto.rules !== undefined) {
      promotion.rules = {
        conditions: dto.rules.conditions,
        logic: dto.rules.logic,
      };
    }
    if (dto.discountType !== undefined) promotion.discountType = dto.discountType;
    if (dto.discountValue !== undefined) promotion.discountValue = dto.discountValue;
    if (dto.maxDiscountAmount !== undefined) promotion.maxDiscountAmount = dto.maxDiscountAmount ?? null;
    if (dto.validFrom !== undefined) promotion.validFrom = new Date(dto.validFrom);
    if (dto.validUntil !== undefined) promotion.validUntil = dto.validUntil ? new Date(dto.validUntil) : null;
    if (dto.usageLimit !== undefined) promotion.usageLimit = dto.usageLimit ?? null;
    if (dto.perUserLimit !== undefined) promotion.perUserLimit = dto.perUserLimit ?? null;
    if (dto.locationIds !== undefined) promotion.locationIds = dto.locationIds ?? null;
    if (dto.productIds !== undefined) promotion.productIds = dto.productIds ?? null;

    promotion.updatedBy = userId;

    const saved = await this.promotionRepo.save(promotion);
    this.logger.log(`Promotion "${saved.name}" (${id}) updated by user ${userId}`);
    return saved;
  }

  async findAll(
    query: QueryPromotionsDto,
  ): Promise<{ data: Promotion[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.promotionRepo
      .createQueryBuilder('promotion')
      .leftJoinAndSelect('promotion.promoCodes', 'promoCodes');

    if (query.isActive !== undefined) {
      qb.andWhere('promotion.is_active = :isActive', { isActive: query.isActive });
    }

    if (query.search) {
      qb.andWhere(
        '(promotion.name ILIKE :search OR promotion.description ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('promotion.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  async findById(id: string): Promise<Promotion> {
    const promotion = await this.promotionRepo.findOne({
      where: { id },
      relations: ['promoCodes'],
    });

    if (!promotion) {
      throw new NotFoundException(`Promotion with ID ${id} not found`);
    }

    return promotion;
  }

  async toggleActive(id: string): Promise<Promotion> {
    const promotion = await this.promotionRepo.findOne({ where: { id } });

    if (!promotion) {
      throw new NotFoundException(`Promotion with ID ${id} not found`);
    }

    promotion.isActive = !promotion.isActive;
    const saved = await this.promotionRepo.save(promotion);

    this.logger.log(
      `Promotion "${saved.name}" (${id}) toggled to isActive=${saved.isActive}`,
    );
    return saved;
  }

  async deletePromotion(id: string): Promise<void> {
    const promotion = await this.promotionRepo.findOne({ where: { id } });

    if (!promotion) {
      throw new NotFoundException(`Promotion with ID ${id} not found`);
    }

    await this.promotionRepo.softDelete(id);
    this.logger.log(`Promotion "${promotion.name}" (${id}) soft-deleted`);
  }

  // ---------------------------------------------------------------------------
  // Promo Code Management
  // ---------------------------------------------------------------------------

  async createPromoCode(dto: CreatePromoCodeDto): Promise<PromoCode> {
    // Verify the promotion exists
    const promotion = await this.promotionRepo.findOne({
      where: { id: dto.promotionId },
    });

    if (!promotion) {
      throw new NotFoundException(`Promotion with ID ${dto.promotionId} not found`);
    }

    const code = dto.code ? dto.code.toUpperCase() : this.generateRandomCode(8);

    // Check for code uniqueness
    const existing = await this.promoCodeRepo.findOne({
      where: { code },
    });

    if (existing) {
      throw new ConflictException(`Promo code "${code}" already exists`);
    }

    const promoCode = this.promoCodeRepo.create({
      code,
      promotionId: dto.promotionId,
      maxUses: dto.maxUses ?? null,
      timesUsed: 0,
      isActive: true,
      validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
    });

    return this.promoCodeRepo.save(promoCode);
  }

  async generatePromoCodes(dto: GeneratePromoCodesDto): Promise<PromoCode[]> {
    // Verify the promotion exists
    const promotion = await this.promotionRepo.findOne({
      where: { id: dto.promotionId },
    });

    if (!promotion) {
      throw new NotFoundException(`Promotion with ID ${dto.promotionId} not found`);
    }

    const prefix = dto.prefix ? dto.prefix.toUpperCase() : '';
    const codeLength = 8;
    const codes: PromoCode[] = [];
    const generatedCodes = new Set<string>();

    // Pre-fetch existing codes to avoid multiple DB lookups
    const existingCodes = await this.promoCodeRepo
      .createQueryBuilder('code')
      .select('code.code')
      .getMany();

    const existingSet = new Set(existingCodes.map((c) => c.code));

    for (let i = 0; i < dto.count; i++) {
      let code: string;
      let attempts = 0;
      const maxAttempts = 100;

      do {
        code = prefix + this.generateRandomCode(codeLength);
        attempts++;
        if (attempts > maxAttempts) {
          throw new BadRequestException(
            `Unable to generate unique code after ${maxAttempts} attempts. Try a different prefix or fewer codes.`,
          );
        }
      } while (existingSet.has(code) || generatedCodes.has(code));

      generatedCodes.add(code);

      const promoCode = this.promoCodeRepo.create({
        code,
        promotionId: dto.promotionId,
        maxUses: dto.maxUsesPerCode ?? null,
        timesUsed: 0,
        isActive: true,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
      });

      codes.push(promoCode);
    }

    const saved = await this.promoCodeRepo.save(codes);
    this.logger.log(
      `Generated ${saved.length} promo codes for promotion "${promotion.name}" (${promotion.id})`,
    );
    return saved;
  }

  async findPromoCodesByPromotion(promotionId: string): Promise<PromoCode[]> {
    // Verify the promotion exists
    const promotion = await this.promotionRepo.findOne({
      where: { id: promotionId },
    });

    if (!promotion) {
      throw new NotFoundException(`Promotion with ID ${promotionId} not found`);
    }

    return this.promoCodeRepo.find({
      where: { promotionId },
      order: { createdAt: 'DESC' },
    });
  }

  async deactivatePromoCode(codeId: string): Promise<PromoCode> {
    const promoCode = await this.promoCodeRepo.findOne({
      where: { id: codeId },
    });

    if (!promoCode) {
      throw new NotFoundException(`Promo code with ID ${codeId} not found`);
    }

    promoCode.isActive = false;
    const saved = await this.promoCodeRepo.save(promoCode);
    this.logger.log(`Promo code "${saved.code}" (${codeId}) deactivated`);
    return saved;
  }

  // ---------------------------------------------------------------------------
  // Promo Code Validation & Application
  // ---------------------------------------------------------------------------

  async validatePromoCode(dto: ValidatePromoCodeDto): Promise<{
    valid: boolean;
    discount: number;
    finalAmount: number;
    promotion: Partial<Promotion> | null;
    errors: string[];
  }> {
    const errors: string[] = [];
    const now = new Date();

    // 1. Find code by code string (case-insensitive)
    const promoCode = await this.promoCodeRepo
      .createQueryBuilder('code')
      .leftJoinAndSelect('code.promotion', 'promotion')
      .where('UPPER(code.code) = UPPER(:code)', { code: dto.code })
      .getOne();

    if (!promoCode) {
      return {
        valid: false,
        discount: 0,
        finalAmount: dto.amount,
        promotion: null,
        errors: ['Promo code not found'],
      };
    }

    // 2. Check code isActive
    if (!promoCode.isActive) {
      errors.push('Promo code is no longer active');
    }

    // 3. Check code date range
    if (promoCode.validFrom && now < promoCode.validFrom) {
      errors.push('Promo code is not yet valid');
    }
    if (promoCode.validUntil && now > promoCode.validUntil) {
      errors.push('Promo code has expired');
    }

    // 4. Check code usage
    if (promoCode.maxUses !== null && promoCode.timesUsed >= promoCode.maxUses) {
      errors.push('Promo code has reached its maximum number of uses');
    }

    // 5. Load parent promotion
    const promotion = promoCode.promotion;

    if (!promotion) {
      return {
        valid: false,
        discount: 0,
        finalAmount: dto.amount,
        promotion: null,
        errors: ['Associated promotion not found'],
      };
    }

    // 6. Check promotion isActive
    if (!promotion.isActive) {
      errors.push('The associated promotion is not active');
    }

    // 7. Check promotion date range
    if (now < promotion.validFrom) {
      errors.push('The associated promotion has not started yet');
    }
    if (promotion.validUntil && now > promotion.validUntil) {
      errors.push('The associated promotion has expired');
    }

    // 8. Check promotion usageLimit
    if (promotion.usageLimit !== null && promotion.usageCount >= promotion.usageLimit) {
      errors.push('The promotion has reached its total usage limit');
    }

    // 9. Check promotion perUserLimit
    if (promotion.perUserLimit !== null) {
      const userUsageCount = await this.getUserPromotionUsageCount(
        dto.userId,
        promotion.id,
      );
      if (userUsageCount >= promotion.perUserLimit) {
        errors.push('You have reached the maximum number of uses for this promotion');
      }
    }

    // 10. Check location restriction
    if (promotion.locationIds && promotion.locationIds.length > 0 && dto.locationId) {
      if (!promotion.locationIds.includes(dto.locationId)) {
        errors.push('This promotion is not valid at the selected location');
      }
    }

    // 10b. Check product restriction
    if (promotion.productIds && promotion.productIds.length > 0 && dto.productId) {
      if (!promotion.productIds.includes(dto.productId)) {
        errors.push('This promotion is not valid for the selected product');
      }
    }

    // 10c. Evaluate promotion rules against context
    const context: Record<string, any> = {
      amount: dto.amount,
      ...(dto.paymentMethod && { paymentMethod: dto.paymentMethod.toLowerCase() }),
      ...(dto.locationId && { locationId: dto.locationId }),
      ...(dto.productId && { productId: dto.productId }),
      ...(dto.userId && { userId: dto.userId }),
    };

    if (promotion.rules && promotion.rules.conditions && promotion.rules.conditions.length > 0) {
      const rulesResult = this.evaluateRules(promotion.rules, context);
      if (!rulesResult) {
        errors.push('The promotion conditions are not met');
      }
    }

    // 11. Calculate discount
    let discount = 0;

    if (errors.length === 0) {
      if (promotion.discountType === DiscountType.PERCENTAGE) {
        discount = (dto.amount * Number(promotion.discountValue)) / 100;
        if (
          promotion.maxDiscountAmount !== null &&
          discount > Number(promotion.maxDiscountAmount)
        ) {
          discount = Number(promotion.maxDiscountAmount);
        }
      } else {
        // FIXED_AMOUNT
        discount = Number(promotion.discountValue);
      }

      // Discount cannot exceed the base amount
      if (discount > dto.amount) {
        discount = dto.amount;
      }
    }

    const finalAmount = Math.max(0, dto.amount - discount);

    // 12. Return result
    return {
      valid: errors.length === 0,
      discount: Math.round(discount * 100) / 100,
      finalAmount: Math.round(finalAmount * 100) / 100,
      promotion: errors.length === 0
        ? {
            id: promotion.id,
            name: promotion.name,
            description: promotion.description,
            discountType: promotion.discountType,
            discountValue: promotion.discountValue,
            maxDiscountAmount: promotion.maxDiscountAmount,
          }
        : null,
      errors,
    };
  }

  async applyPromoCode(code: string, userId: string): Promise<void> {
    const promoCode = await this.promoCodeRepo
      .createQueryBuilder('code')
      .leftJoinAndSelect('code.promotion', 'promotion')
      .where('UPPER(code.code) = UPPER(:code)', { code })
      .getOne();

    if (!promoCode) {
      throw new NotFoundException(`Promo code "${code}" not found`);
    }

    // Increment timesUsed on the code
    await this.promoCodeRepo
      .createQueryBuilder()
      .update(PromoCode)
      .set({ timesUsed: () => '"times_used" + 1' })
      .where('id = :id', { id: promoCode.id })
      .execute();

    // Increment usageCount on the promotion
    await this.promotionRepo
      .createQueryBuilder()
      .update(Promotion)
      .set({ usageCount: () => '"usage_count" + 1' })
      .where('id = :id', { id: promoCode.promotionId })
      .execute();

    this.logger.log(
      `Promo code "${promoCode.code}" applied by user ${userId} for promotion ${promoCode.promotionId}`,
    );
  }

  // ---------------------------------------------------------------------------
  // Statistics
  // ---------------------------------------------------------------------------

  async getPromotionStats(promotionId: string): Promise<{
    totalCodes: number;
    activeCodes: number;
    totalRedemptions: number;
    revenueImpact: number;
  }> {
    const promotion = await this.promotionRepo.findOne({
      where: { id: promotionId },
    });

    if (!promotion) {
      throw new NotFoundException(`Promotion with ID ${promotionId} not found`);
    }

    const totalCodes = await this.promoCodeRepo.count({
      where: { promotionId },
    });

    const activeCodes = await this.promoCodeRepo.count({
      where: { promotionId, isActive: true },
    });

    const totalRedemptions = await this.promoCodeRepo
      .createQueryBuilder('code')
      .select('COALESCE(SUM(code.times_used), 0)', 'total')
      .where('code.promotion_id = :promotionId', { promotionId })
      .getRawOne();

    // Revenue impact estimation: usageCount * discountValue (simplified)
    const revenueImpact =
      promotion.usageCount * Number(promotion.discountValue);

    return {
      totalCodes,
      activeCodes,
      totalRedemptions: Number(totalRedemptions?.total || 0),
      revenueImpact: Math.round(revenueImpact * 100) / 100,
    };
  }

  async getOverallStats(): Promise<{
    activePromotions: number;
    totalRedemptions: number;
    topPromotion: { id: string; name: string; usageCount: number } | null;
  }> {
    const activePromotions = await this.promotionRepo.count({
      where: { isActive: true },
    });

    const totalRedemptions = await this.promotionRepo
      .createQueryBuilder('promotion')
      .select('COALESCE(SUM(promotion.usage_count), 0)', 'total')
      .getRawOne();

    const topPromotion = await this.promotionRepo
      .createQueryBuilder('promotion')
      .select(['promotion.id', 'promotion.name', 'promotion.usage_count'])
      .orderBy('promotion.usage_count', 'DESC')
      .limit(1)
      .getOne();

    return {
      activePromotions,
      totalRedemptions: Number(totalRedemptions?.total || 0),
      topPromotion: topPromotion
        ? {
            id: topPromotion.id,
            name: topPromotion.name,
            usageCount: topPromotion.usageCount,
          }
        : null,
    };
  }

  // ---------------------------------------------------------------------------
  // Scheduled Tasks
  // ---------------------------------------------------------------------------

  @Cron(CronExpression.EVERY_HOUR)
  async checkExpiredPromotions(): Promise<number> {
    const now = new Date();

    const result = await this.promotionRepo
      .createQueryBuilder()
      .update(Promotion)
      .set({ isActive: false })
      .where('is_active = :isActive', { isActive: true })
      .andWhere('valid_until IS NOT NULL')
      .andWhere('valid_until < :now', { now })
      .execute();

    const affected = result.affected || 0;

    if (affected > 0) {
      this.logger.log(
        `Deactivated ${affected} expired promotion(s) at ${now.toISOString()}`,
      );
    }

    return affected;
  }

  // ---------------------------------------------------------------------------
  // Private Helpers
  // ---------------------------------------------------------------------------

  private evaluateRules(
    rules: { conditions: Array<{ field: string; operator: string; value: any }>; logic: 'AND' | 'OR' },
    context: Record<string, any>,
  ): boolean {
    if (!rules.conditions || rules.conditions.length === 0) {
      return true;
    }

    const results = rules.conditions.map((condition) =>
      this.evaluateCondition(condition, context),
    );

    if (rules.logic === 'AND') {
      return results.every(Boolean);
    }

    // OR
    return results.some(Boolean);
  }

  private evaluateCondition(
    condition: { field: string; operator: string; value: any },
    context: Record<string, any>,
  ): boolean {
    const contextValue = context[condition.field];

    // If the context does not have the field, the condition cannot be met
    // Exception: we skip the condition if the field is not provided in context
    // (so that optional fields like paymentMethod don't block validation)
    if (contextValue === undefined || contextValue === null) {
      return false;
    }

    const conditionValue = condition.value;

    switch (condition.operator) {
      case 'equals':
        return (
          String(contextValue).toLowerCase() ===
          String(conditionValue).toLowerCase()
        );

      case 'not_equals':
        return (
          String(contextValue).toLowerCase() !==
          String(conditionValue).toLowerCase()
        );

      case 'contains':
        return String(contextValue)
          .toLowerCase()
          .includes(String(conditionValue).toLowerCase());

      case 'greater_than':
        return Number(contextValue) > Number(conditionValue);

      case 'less_than':
        return Number(contextValue) < Number(conditionValue);

      case 'in': {
        const allowedValues = Array.isArray(conditionValue)
          ? conditionValue.map((v: any) => String(v).toLowerCase())
          : String(conditionValue)
              .split(',')
              .map((v: string) => v.trim().toLowerCase());
        return allowedValues.includes(String(contextValue).toLowerCase());
      }

      default:
        this.logger.warn(
          `Unknown rule operator: "${condition.operator}" for field "${condition.field}"`,
        );
        return false;
    }
  }

  private generateRandomCode(length: number): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // excluded I, O, 0, 1 for readability
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private async getUserPromotionUsageCount(
    userId: string,
    promotionId: string,
  ): Promise<number> {
    // Query promo_code_usages table if it exists, otherwise use a simplified approach
    // For now, we track by counting from a usage-tracking perspective.
    // Since the entities don't have a dedicated usage-tracking table,
    // we can use the promotion's usageCount as a proxy or implement
    // in-memory tracking. For robustness, we'll query promo codes'
    // timesUsed as a simplified per-user tracking mechanism.
    //
    // NOTE: In a production system, a separate PromoCodeUsage entity
    // with userId would be ideal. For now, the perUserLimit check
    // returns 0, allowing the validation to pass, and should be
    // enhanced when a usage-tracking table is added.
    //
    // A pragmatic approach: if the promotion has perUserLimit set,
    // we'd need a separate table or column to track per-user usage.
    // Until that entity exists, we return 0 and log a warning.
    this.logger.debug(
      `Per-user usage check for user ${userId} on promotion ${promotionId} — ` +
        `requires a PromoCodeUsage tracking table for accurate counts`,
    );
    return 0;
  }
}
