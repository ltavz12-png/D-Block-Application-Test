import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreditPackage,
  CreditPackageStatus,
} from '@/common/database/entities/credit-package.entity';
import {
  CreditTransaction,
  CreditTransactionType,
} from '@/common/database/entities/credit-transaction.entity';
import { PurchaseCreditPackageDto } from './dto/purchase-credits.dto';
import { DeductCreditsDto } from './dto/deduct-credits.dto';
import { QueryCreditsDto } from './dto/query-credits.dto';

@Injectable()
export class CreditsService {
  constructor(
    @InjectRepository(CreditPackage)
    private readonly creditPackageRepository: Repository<CreditPackage>,

    @InjectRepository(CreditTransaction)
    private readonly creditTransactionRepository: Repository<CreditTransaction>,
  ) {}

  async purchasePackage(
    dto: PurchaseCreditPackageDto,
    userId: string,
  ): Promise<CreditPackage> {
    const pkg = this.creditPackageRepository.create({
      companyId: dto.companyId,
      totalMinutes: dto.totalMinutes,
      usedMinutes: 0,
      remainingMinutes: dto.totalMinutes,
      purchasePrice: dto.purchasePrice,
      currency: dto.currency || 'GEL',
      paymentId: dto.paymentId || null,
      status: CreditPackageStatus.ACTIVE,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    });

    const saved = await this.creditPackageRepository.save(pkg);

    // Create an allocation transaction
    await this.creditTransactionRepository.save(
      this.creditTransactionRepository.create({
        creditPackageId: saved.id,
        userId,
        transactionType: CreditTransactionType.ALLOCATION,
        minutes: dto.totalMinutes,
        balanceAfter: dto.totalMinutes,
        description: `Purchased credit package of ${dto.totalMinutes} minutes`,
      }),
    );

    return this.creditPackageRepository.findOne({
      where: { id: saved.id },
      relations: ['transactions'],
    }) as Promise<CreditPackage>;
  }

  async deductCredits(dto: DeductCreditsDto): Promise<{
    totalDeducted: number;
    transactionIds: string[];
  }> {
    const packages = await this.creditPackageRepository.find({
      where: {
        companyId: dto.companyId,
        status: CreditPackageStatus.ACTIVE,
      },
      order: { purchasedAt: 'ASC' },
    });

    const totalRemaining = packages.reduce(
      (sum, pkg) => sum + pkg.remainingMinutes,
      0,
    );

    if (totalRemaining < dto.minutes) {
      throw new BadRequestException(
        `Insufficient credits. Requested: ${dto.minutes} minutes, available: ${totalRemaining} minutes`,
      );
    }

    let minutesLeft = dto.minutes;
    let totalDeducted = 0;
    const transactionIds: string[] = [];

    for (const pkg of packages) {
      if (minutesLeft <= 0) break;

      const deductFromThis = Math.min(pkg.remainingMinutes, minutesLeft);

      pkg.usedMinutes += deductFromThis;
      pkg.remainingMinutes -= deductFromThis;

      if (pkg.remainingMinutes === 0) {
        pkg.status = CreditPackageStatus.EXHAUSTED;
      }

      await this.creditPackageRepository.save(pkg);

      const transaction = await this.creditTransactionRepository.save(
        this.creditTransactionRepository.create({
          creditPackageId: pkg.id,
          userId: dto.userId,
          bookingId: dto.bookingId || null,
          transactionType: CreditTransactionType.DEDUCTION,
          minutes: deductFromThis,
          balanceAfter: pkg.remainingMinutes,
          description:
            dto.description || `Deducted ${deductFromThis} minutes`,
        }),
      );

      transactionIds.push(transaction.id);
      totalDeducted += deductFromThis;
      minutesLeft -= deductFromThis;
    }

    return { totalDeducted, transactionIds };
  }

  async refundCredits(
    companyId: string,
    userId: string,
    minutes: number,
    bookingId?: string,
    description?: string,
  ): Promise<CreditTransaction> {
    const pkg = await this.creditPackageRepository.findOne({
      where: [
        { companyId, status: CreditPackageStatus.ACTIVE },
        { companyId, status: CreditPackageStatus.EXHAUSTED },
      ],
      order: { purchasedAt: 'DESC' },
    });

    if (!pkg) {
      throw new NotFoundException(
        `No active or exhausted credit package found for company "${companyId}"`,
      );
    }

    pkg.remainingMinutes += minutes;
    pkg.usedMinutes = Math.max(0, pkg.usedMinutes - minutes);

    if (
      pkg.status === CreditPackageStatus.EXHAUSTED &&
      pkg.remainingMinutes > 0
    ) {
      pkg.status = CreditPackageStatus.ACTIVE;
    }

    await this.creditPackageRepository.save(pkg);

    const transaction = await this.creditTransactionRepository.save(
      this.creditTransactionRepository.create({
        creditPackageId: pkg.id,
        userId,
        bookingId: bookingId || null,
        transactionType: CreditTransactionType.REFUND,
        minutes,
        balanceAfter: pkg.remainingMinutes,
        description: description || `Refunded ${minutes} minutes`,
      }),
    );

    return transaction;
  }

  async getBalance(companyId: string): Promise<{
    totalMinutes: number;
    usedMinutes: number;
    remainingMinutes: number;
  }> {
    const packages = await this.creditPackageRepository.find({
      where: {
        companyId,
        status: CreditPackageStatus.ACTIVE,
      },
    });

    const totalMinutes = packages.reduce(
      (sum, pkg) => sum + pkg.totalMinutes,
      0,
    );
    const usedMinutes = packages.reduce(
      (sum, pkg) => sum + pkg.usedMinutes,
      0,
    );
    const remainingMinutes = packages.reduce(
      (sum, pkg) => sum + pkg.remainingMinutes,
      0,
    );

    return { totalMinutes, usedMinutes, remainingMinutes };
  }

  async getTransactionHistory(
    companyId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: CreditTransaction[];
    total: number;
    page: number;
    limit: number;
  }> {
    const qb = this.creditTransactionRepository
      .createQueryBuilder('tx')
      .leftJoinAndSelect('tx.user', 'user')
      .leftJoinAndSelect('tx.booking', 'booking')
      .innerJoin('tx.creditPackage', 'pkg')
      .where('pkg.companyId = :companyId', { companyId })
      .orderBy('tx.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  async findPackagesByCompany(
    companyId: string,
    query?: QueryCreditsDto,
  ): Promise<{
    data: CreditPackage[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query?.page || 1;
    const limit = query?.limit || 20;

    const qb = this.creditPackageRepository
      .createQueryBuilder('pkg')
      .where('pkg.companyId = :companyId', { companyId });

    if (query?.status) {
      qb.andWhere('pkg.status = :status', { status: query.status });
    }

    qb.orderBy('pkg.purchasedAt', 'DESC');
    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  async findPackageById(id: string): Promise<CreditPackage> {
    const pkg = await this.creditPackageRepository.findOne({
      where: { id },
      relations: ['transactions'],
    });

    if (!pkg) {
      throw new NotFoundException(
        `Credit package with ID "${id}" not found`,
      );
    }

    return pkg;
  }

  async checkExpiredPackages(): Promise<number> {
    const result = await this.creditPackageRepository
      .createQueryBuilder()
      .update(CreditPackage)
      .set({ status: CreditPackageStatus.EXPIRED })
      .where('status = :status', { status: CreditPackageStatus.ACTIVE })
      .andWhere('expiresAt < :now', { now: new Date() })
      .andWhere('expiresAt IS NOT NULL')
      .execute();

    return result.affected || 0;
  }
}
