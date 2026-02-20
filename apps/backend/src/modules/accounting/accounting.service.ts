import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AccountingPeriod,
  PeriodStatus,
} from '@/common/database/entities/accounting-period.entity';
import {
  RevenueEntry,
  RevenueEntryType,
} from '@/common/database/entities/revenue-entry.entity';
import { CreatePeriodDto } from './dto/create-period.dto';
import { ClosePeriodDto } from './dto/close-period.dto';
import { QueryRevenueDto } from './dto/query-revenue.dto';

@Injectable()
export class AccountingService {
  constructor(
    @InjectRepository(AccountingPeriod)
    private readonly periodRepo: Repository<AccountingPeriod>,
    @InjectRepository(RevenueEntry)
    private readonly revenueEntryRepo: Repository<RevenueEntry>,
  ) {}

  // ──── Period Management ─────────────────────────────────────────────

  async createPeriod(
    dto: CreatePeriodDto,
    userId: string,
  ): Promise<AccountingPeriod> {
    // Validate no overlapping periods
    const overlapping = await this.periodRepo
      .createQueryBuilder('period')
      .where('period.start_date <= :endDate', { endDate: dto.endDate })
      .andWhere('period.end_date >= :startDate', { startDate: dto.startDate })
      .getOne();

    if (overlapping) {
      throw new ConflictException(
        `Period overlaps with existing period "${overlapping.name}" (${overlapping.startDate} - ${overlapping.endDate})`,
      );
    }

    const period = this.periodRepo.create({
      name: dto.name,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      status: PeriodStatus.OPEN,
      createdBy: userId,
    });

    return this.periodRepo.save(period);
  }

  async findAllPeriods(
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: AccountingPeriod[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.periodRepo.findAndCount({
      order: { startDate: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findPeriodById(id: string): Promise<AccountingPeriod> {
    const period = await this.periodRepo.findOne({ where: { id } });
    if (!period) {
      throw new NotFoundException(`Accounting period ${id} not found`);
    }
    return period;
  }

  async findCurrentPeriod(): Promise<AccountingPeriod | null> {
    const today = new Date().toISOString().split('T')[0];

    const period = await this.periodRepo
      .createQueryBuilder('period')
      .where('period.status = :status', { status: PeriodStatus.OPEN })
      .andWhere('period.start_date <= :today', { today })
      .andWhere('period.end_date >= :today', { today })
      .getOne();

    return period ?? null;
  }

  async closePeriod(
    id: string,
    dto: ClosePeriodDto,
    userId: string,
  ): Promise<AccountingPeriod> {
    const period = await this.findPeriodById(id);

    if (period.status !== PeriodStatus.OPEN) {
      throw new BadRequestException(
        `Cannot close period "${period.name}": status is ${period.status}, expected ${PeriodStatus.OPEN}`,
      );
    }

    period.status = PeriodStatus.CLOSED;
    period.closedAt = new Date();
    period.closedBy = userId;
    period.closingNotes = dto.closingNotes ?? null;

    return this.periodRepo.save(period);
  }

  async reopenPeriod(id: string): Promise<AccountingPeriod> {
    const period = await this.findPeriodById(id);

    if (period.status !== PeriodStatus.CLOSED) {
      throw new BadRequestException(
        `Cannot reopen period "${period.name}": status is ${period.status}, expected ${PeriodStatus.CLOSED}`,
      );
    }

    period.status = PeriodStatus.OPEN;
    period.closedAt = null;
    period.closedBy = null;
    period.closingNotes = null;

    return this.periodRepo.save(period);
  }

  async getPeriodSummary(id: string): Promise<{
    totalRecognized: number;
    totalDeferred: number;
    totalReversals: number;
    totalAdjustments: number;
    bySourceType: Record<string, { recognized: number; deferred: number }>;
    entryCount: number;
  }> {
    const period = await this.findPeriodById(id);

    // Aggregate totals by entry type
    const totals = await this.revenueEntryRepo
      .createQueryBuilder('entry')
      .select('entry.entry_type', 'entryType')
      .addSelect('SUM(entry.recognized_amount)', 'totalAmount')
      .addSelect('COUNT(*)', 'count')
      .where('entry.accounting_period_id = :periodId', { periodId: id })
      .groupBy('entry.entry_type')
      .getRawMany();

    // Deferred total from recognition entries
    const deferredResult = await this.revenueEntryRepo
      .createQueryBuilder('entry')
      .select('SUM(entry.deferred_remaining)', 'totalDeferred')
      .where('entry.accounting_period_id = :periodId', { periodId: id })
      .andWhere('entry.entry_type = :type', { type: RevenueEntryType.RECOGNITION })
      .getRawOne();

    // By source type
    const bySourceTypeRaw = await this.revenueEntryRepo
      .createQueryBuilder('entry')
      .select('entry.source_type', 'sourceType')
      .addSelect('SUM(entry.recognized_amount)', 'recognized')
      .addSelect(
        'SUM(CASE WHEN entry.entry_type = :recognition THEN entry.deferred_remaining ELSE 0 END)',
        'deferred',
      )
      .where('entry.accounting_period_id = :periodId', { periodId: id })
      .setParameter('recognition', RevenueEntryType.RECOGNITION)
      .groupBy('entry.source_type')
      .getRawMany();

    let totalRecognized = 0;
    let totalReversals = 0;
    let totalAdjustments = 0;
    let entryCount = 0;

    for (const row of totals) {
      const amount = Number(row.totalAmount || 0);
      const count = Number(row.count || 0);
      entryCount += count;

      switch (row.entryType) {
        case RevenueEntryType.RECOGNITION:
          totalRecognized = amount;
          break;
        case RevenueEntryType.REVERSAL:
          totalReversals = amount;
          break;
        case RevenueEntryType.ADJUSTMENT:
          totalAdjustments = amount;
          break;
      }
    }

    const totalDeferred = Number(deferredResult?.totalDeferred || 0);

    const bySourceType: Record<string, { recognized: number; deferred: number }> = {};
    for (const row of bySourceTypeRaw) {
      bySourceType[row.sourceType] = {
        recognized: Number(row.recognized || 0),
        deferred: Number(row.deferred || 0),
      };
    }

    return {
      totalRecognized: Math.round(totalRecognized * 10000) / 10000,
      totalDeferred: Math.round(totalDeferred * 10000) / 10000,
      totalReversals: Math.round(totalReversals * 10000) / 10000,
      totalAdjustments: Math.round(totalAdjustments * 10000) / 10000,
      bySourceType,
      entryCount,
    };
  }

  // ──── Revenue Entry Queries ─────────────────────────────────────────

  async findRevenueEntries(
    query: QueryRevenueDto,
  ): Promise<{ data: RevenueEntry[]; total: number; page: number; limit: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.revenueEntryRepo
      .createQueryBuilder('entry')
      .orderBy('entry.date', 'DESC');

    if (query.sourceType) {
      qb.andWhere('entry.source_type = :sourceType', {
        sourceType: query.sourceType,
      });
    }

    if (query.locationId) {
      qb.andWhere('entry.location_id = :locationId', {
        locationId: query.locationId,
      });
    }

    if (query.productType) {
      qb.andWhere('entry.product_type = :productType', {
        productType: query.productType,
      });
    }

    if (query.dateFrom) {
      qb.andWhere('entry.date >= :dateFrom', { dateFrom: query.dateFrom });
    }

    if (query.dateTo) {
      qb.andWhere('entry.date <= :dateTo', { dateTo: query.dateTo });
    }

    if (query.accountingPeriodId) {
      qb.andWhere('entry.accounting_period_id = :accountingPeriodId', {
        accountingPeriodId: query.accountingPeriodId,
      });
    }

    if (query.entryType) {
      qb.andWhere('entry.entry_type = :entryType', {
        entryType: query.entryType,
      });
    }

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }
}
