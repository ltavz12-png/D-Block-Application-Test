import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { UserPass, PassStatus } from '@/common/database/entities/user-pass.entity';
import { Product, BillingPeriod } from '@/common/database/entities/product.entity';
import { RateCode } from '@/common/database/entities/rate-code.entity';
import { PurchasePassDto } from './dto/purchase-pass.dto';
import { QueryPassDto } from './dto/query-pass.dto';

@Injectable()
export class PassesService {
  constructor(
    @InjectRepository(UserPass)
    private readonly userPassRepository: Repository<UserPass>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(RateCode)
    private readonly rateCodeRepository: Repository<RateCode>,
  ) {}

  async purchasePass(
    userId: string,
    dto: PurchasePassDto,
  ): Promise<UserPass> {
    const product = await this.productRepository.findOne({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${dto.productId}" not found`);
    }

    if (!product.isActive) {
      throw new BadRequestException('Product is not active');
    }

    let rateCode: RateCode | null = null;

    if (dto.rateCodeId) {
      rateCode = await this.rateCodeRepository.findOne({
        where: { id: dto.rateCodeId, productId: dto.productId },
      });

      if (!rateCode) {
        throw new NotFoundException(
          `Rate code with ID "${dto.rateCodeId}" not found for this product`,
        );
      }
    } else {
      rateCode = await this.rateCodeRepository.findOne({
        where: { productId: dto.productId, isActive: true },
        order: { createdAt: 'ASC' },
      });
    }

    const startDate = new Date(dto.startDate);
    const endDate = this.calculateEndDate(startDate, product.billingPeriod);

    const status = dto.paymentId
      ? PassStatus.ACTIVE
      : PassStatus.PENDING_PAYMENT;

    const totalPaid = rateCode ? rateCode.amount : 0;

    const pass = this.userPassRepository.create({
      userId,
      productId: dto.productId,
      rateCodeId: rateCode?.id || null,
      startDate,
      endDate,
      status,
      autoRenew: dto.autoRenew ?? false,
      totalPaid,
      currency: rateCode?.currency || 'GEL',
      paymentId: dto.paymentId || null,
      metadata: dto.metadata || null,
    });

    const saved = await this.userPassRepository.save(pass);

    return this.userPassRepository.findOne({
      where: { id: saved.id },
      relations: ['product'],
    }) as Promise<UserPass>;
  }

  async activatePass(passId: string): Promise<UserPass> {
    const pass = await this.findById(passId);

    pass.status = PassStatus.ACTIVE;

    return this.userPassRepository.save(pass);
  }

  async cancelPass(
    passId: string,
    userId: string,
    reason?: string,
  ): Promise<UserPass> {
    const pass = await this.findById(passId);

    if (pass.userId !== userId) {
      throw new BadRequestException('You can only cancel your own passes');
    }

    pass.status = PassStatus.CANCELLED;
    pass.cancelledAt = new Date();
    pass.cancellationReason = reason || null;

    const now = new Date();
    const startDate = new Date(pass.startDate);
    const endDate = new Date(pass.endDate);

    const totalDays = Math.max(
      1,
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
    );
    const remainingDays = Math.max(
      0,
      Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    );

    pass.refundAmount = parseFloat(
      ((remainingDays / totalDays) * Number(pass.totalPaid)).toFixed(2),
    );

    const saved = await this.userPassRepository.save(pass);

    return this.userPassRepository.findOne({
      where: { id: saved.id },
      relations: ['product', 'rateCode'],
    }) as Promise<UserPass>;
  }

  async suspendPass(passId: string, reason?: string): Promise<UserPass> {
    const pass = await this.findById(passId);

    pass.status = PassStatus.SUSPENDED;

    if (reason) {
      pass.metadata = {
        ...(pass.metadata || {}),
        suspensionReason: reason,
        suspendedAt: new Date().toISOString(),
      };
    }

    return this.userPassRepository.save(pass);
  }

  async renewPass(passId: string): Promise<UserPass> {
    const pass = await this.findById(passId);

    if (
      pass.status !== PassStatus.ACTIVE &&
      pass.status !== PassStatus.EXPIRED
    ) {
      throw new BadRequestException(
        'Only active or expired passes can be renewed',
      );
    }

    const product = await this.productRepository.findOne({
      where: { id: pass.productId },
    });

    if (!product) {
      throw new NotFoundException(
        `Product with ID "${pass.productId}" not found`,
      );
    }

    const newStartDate = new Date(pass.endDate);
    const newEndDate = this.calculateEndDate(newStartDate, product.billingPeriod);

    pass.startDate = newStartDate;
    pass.endDate = newEndDate;
    pass.status = PassStatus.PENDING_PAYMENT;

    return this.userPassRepository.save(pass);
  }

  async findAll(query: QueryPassDto): Promise<{
    data: UserPass[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { userId, productId, status, isExpired, page = 1, limit = 20 } = query;

    const qb = this.userPassRepository
      .createQueryBuilder('pass')
      .leftJoinAndSelect('pass.product', 'product')
      .leftJoinAndSelect('pass.rateCode', 'rateCode');

    if (userId) {
      qb.andWhere('pass.userId = :userId', { userId });
    }

    if (productId) {
      qb.andWhere('pass.productId = :productId', { productId });
    }

    if (status) {
      qb.andWhere('pass.status = :status', { status });
    }

    if (isExpired !== undefined) {
      if (isExpired) {
        qb.andWhere('pass.endDate < :now', { now: new Date() });
      } else {
        qb.andWhere('pass.endDate >= :now', { now: new Date() });
      }
    }

    qb.orderBy('pass.createdAt', 'DESC');
    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  async findById(id: string): Promise<UserPass> {
    const pass = await this.userPassRepository.findOne({
      where: { id },
      relations: ['product', 'rateCode'],
    });

    if (!pass) {
      throw new NotFoundException(`Pass with ID "${id}" not found`);
    }

    return pass;
  }

  async findByUser(userId: string): Promise<UserPass[]> {
    return this.userPassRepository.find({
      where: { userId },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findActiveByUser(userId: string): Promise<UserPass[]> {
    return this.userPassRepository.find({
      where: { userId, status: PassStatus.ACTIVE },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findActivePassForResource(
    userId: string,
    resourceType: string,
  ): Promise<UserPass | null> {
    const activePasses = await this.userPassRepository.find({
      where: { userId, status: PassStatus.ACTIVE },
      relations: ['product'],
    });

    for (const pass of activePasses) {
      const includedResources = pass.product?.includedResources;

      if (Array.isArray(includedResources)) {
        const match = includedResources.find(
          (r) => r.resourceType === resourceType,
        );

        if (match) {
          return pass;
        }
      }
    }

    return null;
  }

  async checkExpiredPasses(): Promise<number> {
    const result = await this.userPassRepository
      .createQueryBuilder()
      .update(UserPass)
      .set({ status: PassStatus.EXPIRED })
      .where('status = :status', { status: PassStatus.ACTIVE })
      .andWhere('endDate < :now', { now: new Date() })
      .execute();

    return result.affected || 0;
  }

  private calculateEndDate(startDate: Date, billingPeriod: BillingPeriod): Date {
    const end = new Date(startDate);

    switch (billingPeriod) {
      case BillingPeriod.HOURLY:
        end.setHours(end.getHours() + 1);
        break;
      case BillingPeriod.DAILY:
        end.setDate(end.getDate() + 1);
        break;
      case BillingPeriod.WEEKLY:
        end.setDate(end.getDate() + 7);
        break;
      case BillingPeriod.MONTHLY:
        end.setMonth(end.getMonth() + 1);
        break;
      case BillingPeriod.QUARTERLY:
        end.setMonth(end.getMonth() + 3);
        break;
      case BillingPeriod.ANNUALLY:
        end.setFullYear(end.getFullYear() + 1);
        break;
      case BillingPeriod.ONE_TIME:
        end.setFullYear(end.getFullYear() + 100);
        break;
      default:
        end.setMonth(end.getMonth() + 1);
        break;
    }

    return end;
  }
}
