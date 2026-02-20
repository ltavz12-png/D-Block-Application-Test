import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import {
  RevenueEntry,
  RevenueEntryType,
} from '@/common/database/entities/revenue-entry.entity';
import {
  AccountingPeriod,
  PeriodStatus,
} from '@/common/database/entities/accounting-period.entity';
import { Booking, BookingStatus } from '@/common/database/entities/booking.entity';
import { UserPass, PassStatus } from '@/common/database/entities/user-pass.entity';
import { Contract, ContractStatus } from '@/common/database/entities/contract.entity';
import { RevenueAdjustmentDto } from './dto/revenue-adjustment.dto';

@Injectable()
export class RevenueRecognitionService {
  constructor(
    @InjectRepository(RevenueEntry)
    private readonly revenueEntryRepo: Repository<RevenueEntry>,
    @InjectRepository(AccountingPeriod)
    private readonly periodRepo: Repository<AccountingPeriod>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(UserPass)
    private readonly userPassRepo: Repository<UserPass>,
    @InjectRepository(Contract)
    private readonly contractRepo: Repository<Contract>,
  ) {}

  /**
   * IFRS 15: Recognize booking revenue in full on the service date.
   * Single bookings deliver the service at the time of the booking,
   * so 100% of revenue is recognized immediately.
   */
  async recognizeBookingRevenue(
    bookingId: string,
    date: Date,
  ): Promise<RevenueEntry> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: ['resource'],
    });
    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }

    const period = await this.findOpenPeriodForDate(date);

    const entry = this.revenueEntryRepo.create({
      sourceType: 'booking',
      sourceId: bookingId,
      date,
      entryType: RevenueEntryType.RECOGNITION,
      recognizedAmount: Number(booking.totalAmount),
      deferredRemaining: 0,
      totalContractValue: Number(booking.totalAmount),
      currency: booking.currency,
      locationId: booking.resource?.locationId ?? null,
      productType: 'booking',
      accountingPeriodId: period.id,
      calculationDetails: {
        dailyRate: Number(booking.totalAmount),
        totalDays: 1,
        daysElapsed: 1,
        daysRemaining: 0,
        periodStart: date.toISOString().split('T')[0],
        periodEnd: date.toISOString().split('T')[0],
      },
    });

    return this.revenueEntryRepo.save(entry);
  }

  /**
   * IFRS 15: Recognize pass/subscription revenue daily over the pass period.
   * dailyRate = totalPaid / totalDays
   * Each call recognizes one day's worth of revenue.
   */
  async recognizePassRevenue(
    passId: string,
    date: Date,
  ): Promise<RevenueEntry> {
    const pass = await this.userPassRepo.findOne({ where: { id: passId } });
    if (!pass) {
      throw new NotFoundException(`Pass ${passId} not found`);
    }

    const period = await this.findOpenPeriodForDate(date);

    const startDate = new Date(pass.startDate);
    const endDate = new Date(pass.endDate);
    const totalDays = this.daysBetween(startDate, endDate);
    const daysElapsed = this.daysBetween(startDate, date);
    const dailyRate = Number(pass.totalPaid) / totalDays;
    const recognizedAmount = dailyRate;
    const deferredRemaining =
      Number(pass.totalPaid) - dailyRate * daysElapsed;

    const entry = this.revenueEntryRepo.create({
      sourceType: 'pass',
      sourceId: passId,
      date,
      entryType: RevenueEntryType.RECOGNITION,
      recognizedAmount: Math.round(recognizedAmount * 10000) / 10000,
      deferredRemaining: Math.round(Math.max(deferredRemaining, 0) * 10000) / 10000,
      totalContractValue: Number(pass.totalPaid),
      currency: pass.currency,
      locationId: null,
      productType: 'pass',
      accountingPeriodId: period.id,
      calculationDetails: {
        dailyRate: Math.round(dailyRate * 10000) / 10000,
        totalDays,
        daysElapsed,
        daysRemaining: totalDays - daysElapsed,
        periodStart: startDate.toISOString().split('T')[0],
        periodEnd: endDate.toISOString().split('T')[0],
      },
    });

    return this.revenueEntryRepo.save(entry);
  }

  /**
   * IFRS 15: Recognize contract revenue daily.
   * Simpler approach: dailyRate = monthlyAmount / daysInCurrentMonth
   */
  async recognizeContractRevenue(
    contractId: string,
    date: Date,
  ): Promise<RevenueEntry> {
    const contract = await this.contractRepo.findOne({
      where: { id: contractId },
    });
    if (!contract) {
      throw new NotFoundException(`Contract ${contractId} not found`);
    }

    const period = await this.findOpenPeriodForDate(date);

    const daysInMonth = this.getDaysInMonth(date);
    const dailyRate = Number(contract.monthlyAmount) / daysInMonth;
    const recognizedAmount = dailyRate;

    const startDate = new Date(contract.startDate);
    const endDate = new Date(contract.endDate);
    const totalDays = this.daysBetween(startDate, endDate);
    const daysElapsed = this.daysBetween(startDate, date);
    const totalContractValue =
      Number(contract.monthlyAmount) *
      this.monthsBetween(startDate, endDate);
    const totalRecognizedSoFar = dailyRate * daysElapsed;
    const deferredRemaining = totalContractValue - totalRecognizedSoFar;

    const entry = this.revenueEntryRepo.create({
      sourceType: 'contract',
      sourceId: contractId,
      date,
      entryType: RevenueEntryType.RECOGNITION,
      recognizedAmount: Math.round(recognizedAmount * 10000) / 10000,
      deferredRemaining: Math.round(Math.max(deferredRemaining, 0) * 10000) / 10000,
      totalContractValue: Math.round(totalContractValue * 100) / 100,
      currency: contract.currency,
      locationId: contract.locationId,
      productType: 'contract',
      accountingPeriodId: period.id,
      calculationDetails: {
        dailyRate: Math.round(dailyRate * 10000) / 10000,
        totalDays,
        daysElapsed,
        daysRemaining: totalDays - daysElapsed,
        periodStart: startDate.toISOString().split('T')[0],
        periodEnd: endDate.toISOString().split('T')[0],
      },
    });

    return this.revenueEntryRepo.save(entry);
  }

  /**
   * Main cron-callable method: runs daily recognition for a given date.
   * Finds all active passes, contracts, and confirmed bookings for the date,
   * and creates revenue entries for each.
   */
  async runDailyRecognition(date: Date): Promise<{
    passesProcessed: number;
    contractsProcessed: number;
    bookingsProcessed: number;
    totalRecognized: number;
  }> {
    const period = await this.findOpenPeriodForDate(date);
    if (!period) {
      throw new BadRequestException(
        `No open accounting period found for date ${date.toISOString().split('T')[0]}`,
      );
    }

    const dateStr = date.toISOString().split('T')[0];
    let totalRecognized = 0;

    // 1. Find all ACTIVE passes that span this date
    const activePasses = await this.userPassRepo
      .createQueryBuilder('pass')
      .where('pass.status = :status', { status: PassStatus.ACTIVE })
      .andWhere('pass.start_date <= :date', { date: dateStr })
      .andWhere('pass.end_date >= :date', { date: dateStr })
      .getMany();

    for (const pass of activePasses) {
      const entry = await this.recognizePassRevenue(pass.id, date);
      totalRecognized += Number(entry.recognizedAmount);
    }

    // 2. Find all ACTIVE contracts that span this date
    const activeContracts = await this.contractRepo
      .createQueryBuilder('contract')
      .where('contract.status = :status', { status: ContractStatus.ACTIVE })
      .andWhere('contract.start_date <= :date', { date: dateStr })
      .andWhere('contract.end_date >= :date', { date: dateStr })
      .getMany();

    for (const contract of activeContracts) {
      const entry = await this.recognizeContractRevenue(contract.id, date);
      totalRecognized += Number(entry.recognizedAmount);
    }

    // 3. Find all CONFIRMED bookings on this date that haven't been recognized yet
    const startOfDay = new Date(dateStr + 'T00:00:00.000Z');
    const endOfDay = new Date(dateStr + 'T23:59:59.999Z');

    const confirmedBookings = await this.bookingRepo
      .createQueryBuilder('booking')
      .where('booking.status = :status', { status: BookingStatus.CONFIRMED })
      .andWhere('booking.start_time >= :startOfDay', { startOfDay })
      .andWhere('booking.start_time <= :endOfDay', { endOfDay })
      .getMany();

    // Filter out bookings that have already been recognized
    const alreadyRecognized = await this.revenueEntryRepo
      .createQueryBuilder('entry')
      .where('entry.source_type = :sourceType', { sourceType: 'booking' })
      .andWhere('entry.entry_type = :entryType', {
        entryType: RevenueEntryType.RECOGNITION,
      })
      .andWhere('entry.source_id IN (:...sourceIds)', {
        sourceIds: confirmedBookings.length > 0
          ? confirmedBookings.map((b) => b.id)
          : ['00000000-0000-0000-0000-000000000000'],
      })
      .getMany();

    const recognizedBookingIds = new Set(
      alreadyRecognized.map((e) => e.sourceId),
    );

    const unrecognizedBookings = confirmedBookings.filter(
      (b) => !recognizedBookingIds.has(b.id),
    );

    for (const booking of unrecognizedBookings) {
      const entry = await this.recognizeBookingRevenue(booking.id, date);
      totalRecognized += Number(entry.recognizedAmount);
    }

    return {
      passesProcessed: activePasses.length,
      contractsProcessed: activeContracts.length,
      bookingsProcessed: unrecognizedBookings.length,
      totalRecognized: Math.round(totalRecognized * 10000) / 10000,
    };
  }

  /**
   * Reverse previously recognized revenue.
   * Used when a booking is cancelled, pass is cancelled mid-period, etc.
   */
  async reverseRevenue(
    sourceType: string,
    sourceId: string,
    date: Date,
    amount: number,
    reason: string,
  ): Promise<RevenueEntry> {
    const period = await this.findOpenPeriodForDate(date);

    const entry = this.revenueEntryRepo.create({
      sourceType,
      sourceId,
      date,
      entryType: RevenueEntryType.REVERSAL,
      recognizedAmount: -Math.abs(amount),
      deferredRemaining: 0,
      totalContractValue: 0,
      currency: 'GEL',
      accountingPeriodId: period.id,
      calculationDetails: {
        dailyRate: 0,
        totalDays: 0,
        daysElapsed: 0,
        daysRemaining: 0,
        periodStart: date.toISOString().split('T')[0],
        periodEnd: date.toISOString().split('T')[0],
      },
    });

    return this.revenueEntryRepo.save(entry);
  }

  /**
   * Create a manual revenue adjustment entry.
   * Validates the accounting period for the given date is OPEN.
   */
  async createAdjustment(dto: RevenueAdjustmentDto): Promise<RevenueEntry> {
    const date = new Date(dto.date);
    const period = await this.findOpenPeriodForDate(date);

    if (period.status !== PeriodStatus.OPEN) {
      throw new BadRequestException(
        'Cannot create adjustment: accounting period is not open',
      );
    }

    const entry = this.revenueEntryRepo.create({
      sourceType: dto.sourceType,
      sourceId: dto.sourceId,
      date,
      entryType: RevenueEntryType.ADJUSTMENT,
      recognizedAmount: dto.amount,
      deferredRemaining: 0,
      totalContractValue: 0,
      currency: 'GEL',
      locationId: dto.locationId ?? null,
      productType: dto.productType ?? null,
      accountingPeriodId: period.id,
      calculationDetails: {
        dailyRate: 0,
        totalDays: 0,
        daysElapsed: 0,
        daysRemaining: 0,
        periodStart: date.toISOString().split('T')[0],
        periodEnd: date.toISOString().split('T')[0],
      },
    });

    return this.revenueEntryRepo.save(entry);
  }

  /**
   * Aggregate revenue entries for a given accounting period,
   * grouped by sourceType and productType.
   */
  async getRevenueByPeriod(periodId: string): Promise<{
    totalRecognized: number;
    totalDeferred: number;
    bySourceType: Record<string, { recognized: number; deferred: number }>;
    byProductType: Record<string, { recognized: number; deferred: number }>;
  }> {
    const period = await this.periodRepo.findOne({ where: { id: periodId } });
    if (!period) {
      throw new NotFoundException(`Accounting period ${periodId} not found`);
    }

    const bySourceType = await this.revenueEntryRepo
      .createQueryBuilder('entry')
      .select('entry.source_type', 'sourceType')
      .addSelect('SUM(entry.recognized_amount)', 'recognized')
      .addSelect(
        'SUM(CASE WHEN entry.entry_type = :recognition THEN entry.deferred_remaining ELSE 0 END)',
        'deferred',
      )
      .where('entry.accounting_period_id = :periodId', { periodId })
      .setParameter('recognition', RevenueEntryType.RECOGNITION)
      .groupBy('entry.source_type')
      .getRawMany();

    const byProductType = await this.revenueEntryRepo
      .createQueryBuilder('entry')
      .select('entry.product_type', 'productType')
      .addSelect('SUM(entry.recognized_amount)', 'recognized')
      .addSelect(
        'SUM(CASE WHEN entry.entry_type = :recognition THEN entry.deferred_remaining ELSE 0 END)',
        'deferred',
      )
      .where('entry.accounting_period_id = :periodId', { periodId })
      .setParameter('recognition', RevenueEntryType.RECOGNITION)
      .groupBy('entry.product_type')
      .getRawMany();

    const totalRecognized = bySourceType.reduce(
      (sum, row) => sum + Number(row.recognized || 0),
      0,
    );
    const totalDeferred = bySourceType.reduce(
      (sum, row) => sum + Number(row.deferred || 0),
      0,
    );

    const sourceTypeMap: Record<string, { recognized: number; deferred: number }> = {};
    for (const row of bySourceType) {
      sourceTypeMap[row.sourceType] = {
        recognized: Number(row.recognized || 0),
        deferred: Number(row.deferred || 0),
      };
    }

    const productTypeMap: Record<string, { recognized: number; deferred: number }> = {};
    for (const row of byProductType) {
      productTypeMap[row.productType || 'unknown'] = {
        recognized: Number(row.recognized || 0),
        deferred: Number(row.deferred || 0),
      };
    }

    return {
      totalRecognized: Math.round(totalRecognized * 10000) / 10000,
      totalDeferred: Math.round(totalDeferred * 10000) / 10000,
      bySourceType: sourceTypeMap,
      byProductType: productTypeMap,
    };
  }

  /**
   * Revenue summary across a date range, with optional location filter.
   * Returns total recognized, total deferred, breakdown by sourceType and location.
   */
  async getRevenueSummary(
    dateFrom: Date,
    dateTo: Date,
    locationId?: string,
  ): Promise<{
    totalRecognized: number;
    totalDeferred: number;
    bySourceType: {
      booking: number;
      pass: number;
      contract: number;
    };
    byLocation: Record<string, number>;
  }> {
    const qb = this.revenueEntryRepo
      .createQueryBuilder('entry')
      .where('entry.date >= :dateFrom', { dateFrom })
      .andWhere('entry.date <= :dateTo', { dateTo });

    if (locationId) {
      qb.andWhere('entry.location_id = :locationId', { locationId });
    }

    const bySourceType = await qb
      .clone()
      .select('entry.source_type', 'sourceType')
      .addSelect('SUM(entry.recognized_amount)', 'recognized')
      .groupBy('entry.source_type')
      .getRawMany();

    const byLocation = await qb
      .clone()
      .select('entry.location_id', 'locationId')
      .addSelect('SUM(entry.recognized_amount)', 'recognized')
      .groupBy('entry.location_id')
      .getRawMany();

    // Get deferred total (latest deferred_remaining per source from RECOGNITION entries)
    const deferredResult = await qb
      .clone()
      .select('SUM(entry.deferred_remaining)', 'totalDeferred')
      .andWhere('entry.entry_type = :recognition', {
        recognition: RevenueEntryType.RECOGNITION,
      })
      .getRawOne();

    const totalRecognized = bySourceType.reduce(
      (sum, row) => sum + Number(row.recognized || 0),
      0,
    );

    const sourceTypeResult = {
      booking: 0,
      pass: 0,
      contract: 0,
    };
    for (const row of bySourceType) {
      if (row.sourceType in sourceTypeResult) {
        sourceTypeResult[row.sourceType as keyof typeof sourceTypeResult] =
          Number(row.recognized || 0);
      }
    }

    const locationMap: Record<string, number> = {};
    for (const row of byLocation) {
      const key = row.locationId || 'unassigned';
      locationMap[key] = Number(row.recognized || 0);
    }

    return {
      totalRecognized: Math.round(totalRecognized * 10000) / 10000,
      totalDeferred: Math.round(
        Number(deferredResult?.totalDeferred || 0) * 10000,
      ) / 10000,
      bySourceType: sourceTypeResult,
      byLocation: locationMap,
    };
  }

  // ──── Private Helpers ──────────────────────────────────────────────

  private async findOpenPeriodForDate(date: Date): Promise<AccountingPeriod> {
    const dateStr = date.toISOString().split('T')[0];
    const period = await this.periodRepo
      .createQueryBuilder('period')
      .where('period.status = :status', { status: PeriodStatus.OPEN })
      .andWhere('period.start_date <= :date', { date: dateStr })
      .andWhere('period.end_date >= :date', { date: dateStr })
      .getOne();

    if (!period) {
      throw new BadRequestException(
        `No open accounting period found for date ${dateStr}`,
      );
    }

    return period;
  }

  private daysBetween(start: Date, end: Date): number {
    const startMs = new Date(start).setHours(0, 0, 0, 0);
    const endMs = new Date(end).setHours(0, 0, 0, 0);
    const diffMs = endMs - startMs;
    return Math.max(Math.ceil(diffMs / (1000 * 60 * 60 * 24)), 1);
  }

  private getDaysInMonth(date: Date): number {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  }

  private monthsBetween(start: Date, end: Date): number {
    const s = new Date(start);
    const e = new Date(end);
    const months =
      (e.getFullYear() - s.getFullYear()) * 12 +
      (e.getMonth() - s.getMonth());
    return Math.max(months, 1);
  }
}
