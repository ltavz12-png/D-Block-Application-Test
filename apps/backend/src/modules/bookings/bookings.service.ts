import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThan } from 'typeorm';
import {
  Booking,
  BookingStatus,
  BookingPaymentStatus,
} from '@/common/database/entities/booking.entity';
import {
  Resource,
  PricingModel,
} from '@/common/database/entities/resource.entity';
import {
  UserPass,
  PassStatus,
} from '@/common/database/entities/user-pass.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { QueryBookingDto } from './dto/query-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,
    @InjectRepository(UserPass)
    private readonly userPassRepository: Repository<UserPass>,
  ) {}

  // ─── Core Methods ───────────────────────────────────────────────

  async createBooking(
    userId: string,
    dto: CreateBookingDto,
  ): Promise<Booking> {
    // 1. Find resource and validate
    const resource = await this.resourceRepository.findOne({
      where: { id: dto.resourceId },
      relations: ['location'],
    });

    if (!resource) {
      throw new NotFoundException(`Resource with ID "${dto.resourceId}" not found`);
    }

    if (!resource.isActive) {
      throw new BadRequestException('Resource is not active');
    }

    if (!resource.isBookable) {
      throw new BadRequestException('Resource is not bookable');
    }

    // 2. Parse dates
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    if (endTime <= startTime) {
      throw new BadRequestException('End time must be after start time');
    }

    // 3. Validate booking rules (min/max duration, advance booking)
    this.validateBookingRules(resource, startTime, endTime);

    // 4. Validate availability rules (operating hours)
    this.validateAvailability(resource, startTime, endTime);

    // 5. Check for conflicts
    await this.checkConflicts(resource.id, startTime, endTime);

    // 6. Calculate price
    const { amount, currency } = this.calculatePrice(resource, startTime, endTime);

    // 7. Determine payment status
    let paymentStatus = BookingPaymentStatus.PENDING;
    let passId: string | null = dto.passId ?? null;

    if (dto.passId) {
      // Validate the pass
      const userPass = await this.userPassRepository.findOne({
        where: { id: dto.passId },
        relations: ['product'],
      });

      if (!userPass) {
        throw new NotFoundException(`Pass with ID "${dto.passId}" not found`);
      }

      if (userPass.status !== PassStatus.ACTIVE) {
        throw new BadRequestException('Pass is not active');
      }

      const now = new Date();
      const passStart = new Date(userPass.startDate);
      const passEnd = new Date(userPass.endDate);

      if (now < passStart || now > passEnd) {
        throw new BadRequestException('Current date is outside the pass validity period');
      }

      // Check if the pass product includes the resource type
      if (userPass.product?.includedResources) {
        const included = userPass.product.includedResources.some(
          (ir) => ir.resourceType === resource.resourceType,
        );
        if (!included) {
          throw new BadRequestException(
            `Pass does not include resource type "${resource.resourceType}"`,
          );
        }
      }

      paymentStatus = BookingPaymentStatus.INCLUDED_IN_PASS;
    } else if (dto.payWithCredits) {
      paymentStatus = BookingPaymentStatus.CREDIT_USED;
    }

    // 8. Create booking
    const booking = this.bookingRepository.create({
      userId,
      resourceId: dto.resourceId,
      startTime,
      endTime,
      status: BookingStatus.HELD,
      paymentStatus,
      passId,
      totalAmount: resource.pricingModel === PricingModel.INCLUDED_IN_PASS || resource.pricingModel === PricingModel.CREDIT_BASED
        ? 0
        : amount,
      discountAmount: 0,
      currency,
      promoCodeId: dto.promoCodeId ?? null,
      notes: dto.notes ?? null,
      metadata: dto.metadata ?? null,
    });

    const saved = await this.bookingRepository.save(booking);

    // 9. Return with resource relation
    return this.bookingRepository.findOne({
      where: { id: saved.id },
      relations: ['resource', 'resource.location'],
    }) as Promise<Booking>;
  }

  async confirmBooking(
    bookingId: string,
    paymentId?: string,
  ): Promise<Booking> {
    const booking = await this.findById(bookingId);

    if (booking.status !== BookingStatus.HELD) {
      throw new BadRequestException(
        `Booking cannot be confirmed. Current status: "${booking.status}". Only bookings with status "held" can be confirmed.`,
      );
    }

    booking.status = BookingStatus.CONFIRMED;

    if (paymentId) {
      booking.paymentId = paymentId;
      booking.paymentStatus = BookingPaymentStatus.PAID;
    }

    return this.bookingRepository.save(booking);
  }

  async updateBooking(
    bookingId: string,
    dto: UpdateBookingDto,
  ): Promise<Booking> {
    const booking = await this.findById(bookingId);

    if (dto.notes !== undefined) {
      booking.notes = dto.notes;
    }

    if (dto.metadata !== undefined) {
      booking.metadata = dto.metadata;
    }

    return this.bookingRepository.save(booking);
  }

  async cancelBooking(
    bookingId: string,
    userId: string,
    dto: CancelBookingDto,
  ): Promise<Booking> {
    const booking = await this.findById(bookingId);

    if (
      booking.status === BookingStatus.CANCELLED ||
      booking.status === BookingStatus.COMPLETED
    ) {
      throw new BadRequestException(
        `Booking cannot be cancelled. Current status: "${booking.status}"`,
      );
    }

    booking.status = BookingStatus.CANCELLED;
    booking.cancelledAt = new Date();
    booking.cancelledBy = userId;
    booking.cancellationReason = dto.reason ?? null;

    return this.bookingRepository.save(booking);
  }

  async checkIn(bookingId: string): Promise<Booking> {
    const booking = await this.findById(bookingId);

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(
        `Booking cannot be checked in. Current status: "${booking.status}". Only confirmed bookings can be checked in.`,
      );
    }

    booking.status = BookingStatus.CHECKED_IN;
    booking.checkedInAt = new Date();

    return this.bookingRepository.save(booking);
  }

  async checkOut(bookingId: string): Promise<Booking> {
    const booking = await this.findById(bookingId);

    if (booking.status !== BookingStatus.CHECKED_IN) {
      throw new BadRequestException(
        `Booking cannot be checked out. Current status: "${booking.status}". Only checked-in bookings can be checked out.`,
      );
    }

    booking.status = BookingStatus.COMPLETED;
    booking.checkedOutAt = new Date();

    return this.bookingRepository.save(booking);
  }

  async markNoShow(bookingId: string): Promise<Booking> {
    const booking = await this.findById(bookingId);

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException(
        `Booking cannot be marked as no-show. Current status: "${booking.status}". Only confirmed bookings can be marked as no-show.`,
      );
    }

    if (new Date() < booking.startTime) {
      throw new BadRequestException(
        'Cannot mark as no-show before the booking start time',
      );
    }

    booking.status = BookingStatus.NO_SHOW;

    return this.bookingRepository.save(booking);
  }

  // ─── Query Methods ──────────────────────────────────────────────

  async findAll(query: QueryBookingDto): Promise<{
    data: Booking[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      userId,
      resourceId,
      locationId,
      status,
      paymentStatus,
      resourceType,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
      sortBy = 'startTime',
      sortOrder = 'DESC',
    } = query;

    const qb = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.resource', 'resource')
      .leftJoinAndSelect('resource.location', 'location')
      .leftJoinAndSelect('booking.user', 'user');

    if (userId) {
      qb.andWhere('booking.userId = :userId', { userId });
    }

    if (resourceId) {
      qb.andWhere('booking.resourceId = :resourceId', { resourceId });
    }

    if (locationId) {
      qb.andWhere('resource.locationId = :locationId', { locationId });
    }

    if (status) {
      qb.andWhere('booking.status = :status', { status });
    }

    if (paymentStatus) {
      qb.andWhere('booking.paymentStatus = :paymentStatus', { paymentStatus });
    }

    if (resourceType) {
      qb.andWhere('resource.resourceType = :resourceType', { resourceType });
    }

    if (dateFrom) {
      qb.andWhere('booking.startTime >= :dateFrom', {
        dateFrom: new Date(dateFrom),
      });
    }

    if (dateTo) {
      qb.andWhere('booking.endTime <= :dateTo', {
        dateTo: new Date(dateTo),
      });
    }

    const sortField =
      sortBy === 'createdAt' ? 'booking.createdAt' : 'booking.startTime';
    qb.orderBy(sortField, sortOrder);

    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  async findById(id: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['resource', 'resource.location', 'user'],
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID "${id}" not found`);
    }

    return booking;
  }

  async findByUser(
    userId: string,
    query: QueryBookingDto,
  ): Promise<{
    data: Booking[];
    total: number;
    page: number;
    limit: number;
  }> {
    return this.findAll({ ...query, userId });
  }

  async findUpcoming(userId: string): Promise<Booking[]> {
    const now = new Date();

    return this.bookingRepository.find({
      where: {
        userId,
        status: In([BookingStatus.HELD, BookingStatus.CONFIRMED]),
        startTime: MoreThan(now),
      },
      relations: ['resource', 'resource.location'],
      order: { startTime: 'ASC' },
      take: 10,
    });
  }

  async getBookingStats(filters?: {
    locationId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{
    totalBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
    totalRevenue: number;
    averageBookingDuration: number;
  }> {
    const qb = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoin('booking.resource', 'resource');

    if (filters?.locationId) {
      qb.andWhere('resource.locationId = :locationId', {
        locationId: filters.locationId,
      });
    }

    if (filters?.dateFrom) {
      qb.andWhere('booking.startTime >= :dateFrom', {
        dateFrom: filters.dateFrom,
      });
    }

    if (filters?.dateTo) {
      qb.andWhere('booking.endTime <= :dateTo', {
        dateTo: filters.dateTo,
      });
    }

    const stats = await qb
      .select('COUNT(booking.id)', 'totalBookings')
      .addSelect(
        `SUM(CASE WHEN booking.status = '${BookingStatus.CONFIRMED}' THEN 1 ELSE 0 END)`,
        'confirmedBookings',
      )
      .addSelect(
        `SUM(CASE WHEN booking.status = '${BookingStatus.CANCELLED}' THEN 1 ELSE 0 END)`,
        'cancelledBookings',
      )
      .addSelect('COALESCE(SUM(booking.totalAmount), 0)', 'totalRevenue')
      .addSelect(
        'COALESCE(AVG(EXTRACT(EPOCH FROM (booking.endTime - booking.startTime)) / 60), 0)',
        'averageBookingDuration',
      )
      .getRawOne();

    return {
      totalBookings: parseInt(stats.totalBookings, 10) || 0,
      confirmedBookings: parseInt(stats.confirmedBookings, 10) || 0,
      cancelledBookings: parseInt(stats.cancelledBookings, 10) || 0,
      totalRevenue: parseFloat(stats.totalRevenue) || 0,
      averageBookingDuration: Math.round(parseFloat(stats.averageBookingDuration) || 0),
    };
  }

  // ─── Private Helpers ────────────────────────────────────────────

  private calculatePrice(
    resource: Resource,
    startTime: Date,
    endTime: Date,
  ): { amount: number; currency: string } {
    const currency = resource.pricingDetails?.currency ?? 'GEL';
    const durationMs = endTime.getTime() - startTime.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

    switch (resource.pricingModel) {
      case PricingModel.HOURLY: {
        const perHour = resource.pricingDetails?.perHour ?? 0;
        return { amount: Math.round(durationHours * perHour * 100) / 100, currency };
      }
      case PricingModel.DAILY: {
        const perDay = resource.pricingDetails?.perDay ?? 0;
        return { amount: Math.round(durationDays * perDay * 100) / 100, currency };
      }
      case PricingModel.PER_USE: {
        const basePrice = resource.pricingDetails?.basePrice ?? 0;
        return { amount: basePrice, currency };
      }
      case PricingModel.INCLUDED_IN_PASS: {
        return { amount: 0, currency };
      }
      case PricingModel.CREDIT_BASED: {
        return { amount: 0, currency };
      }
      case PricingModel.MONTHLY: {
        const perMonth = resource.pricingDetails?.perMonth ?? 0;
        return { amount: perMonth, currency };
      }
      case PricingModel.PER_SQM: {
        const perSqm = resource.pricingDetails?.perSqm ?? 0;
        const size = Number(resource.size) || 0;
        return { amount: Math.round(perSqm * size * 100) / 100, currency };
      }
      default: {
        return { amount: 0, currency };
      }
    }
  }

  private validateBookingRules(
    resource: Resource,
    startTime: Date,
    endTime: Date,
  ): void {
    const rules = resource.bookingRules;
    if (!rules) return;

    const durationMinutes =
      (endTime.getTime() - startTime.getTime()) / (1000 * 60);

    if (
      rules.minDurationMinutes !== undefined &&
      durationMinutes < rules.minDurationMinutes
    ) {
      throw new BadRequestException(
        `Booking duration (${Math.round(durationMinutes)} min) is below the minimum of ${rules.minDurationMinutes} minutes`,
      );
    }

    if (
      rules.maxDurationMinutes !== undefined &&
      durationMinutes > rules.maxDurationMinutes
    ) {
      throw new BadRequestException(
        `Booking duration (${Math.round(durationMinutes)} min) exceeds the maximum of ${rules.maxDurationMinutes} minutes`,
      );
    }

    if (rules.advanceBookingDays !== undefined) {
      const now = new Date();
      const maxAdvanceDate = new Date(now);
      maxAdvanceDate.setDate(maxAdvanceDate.getDate() + rules.advanceBookingDays);

      if (startTime > maxAdvanceDate) {
        throw new BadRequestException(
          `Cannot book more than ${rules.advanceBookingDays} days in advance`,
        );
      }
    }
  }

  private validateAvailability(
    resource: Resource,
    startTime: Date,
    endTime: Date,
  ): void {
    const rules = resource.availabilityRules;
    if (!rules || rules.length === 0) return;

    const dayOfWeek = startTime.getDay();
    const dayRule = rules.find((r) => r.dayOfWeek === dayOfWeek);

    if (!dayRule) {
      throw new BadRequestException(
        `Resource is not available on this day of the week (day ${dayOfWeek})`,
      );
    }

    const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();

    const openMinutes = this.timeToMinutes(dayRule.openTime);
    const closeMinutes = this.timeToMinutes(dayRule.closeTime);

    if (startMinutes < openMinutes || endMinutes > closeMinutes) {
      throw new BadRequestException(
        `Requested time (${this.minutesToTime(startMinutes)}-${this.minutesToTime(endMinutes)}) is outside operating hours (${dayRule.openTime}-${dayRule.closeTime})`,
      );
    }
  }

  private async checkConflicts(
    resourceId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string,
  ): Promise<void> {
    // Get buffer minutes from the resource
    const resource = await this.resourceRepository.findOne({
      where: { id: resourceId },
    });

    const bufferMinutes = resource?.bookingRules?.bufferMinutes ?? 0;
    const bufferMs = bufferMinutes * 60 * 1000;

    // Expand the check window by buffer
    const bufferedStart = new Date(startTime.getTime() - bufferMs);
    const bufferedEnd = new Date(endTime.getTime() + bufferMs);

    const qb = this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.resourceId = :resourceId', { resourceId })
      .andWhere('booking.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: [BookingStatus.CANCELLED, BookingStatus.NO_SHOW],
      })
      .andWhere('booking.startTime < :bufferedEnd', { bufferedEnd })
      .andWhere('booking.endTime > :bufferedStart', { bufferedStart });

    if (excludeBookingId) {
      qb.andWhere('booking.id != :excludeBookingId', { excludeBookingId });
    }

    const conflictCount = await qb.getCount();

    if (conflictCount > 0) {
      throw new ConflictException(
        'The requested time slot conflicts with an existing booking',
      );
    }
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }
}
