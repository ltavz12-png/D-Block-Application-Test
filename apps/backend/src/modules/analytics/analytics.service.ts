import { Injectable, Logger, Optional, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AnalyticsEvent,
  AnalyticsEventCategory,
} from '@/common/database/entities/analytics-event.entity';
import { TrackEventDto } from './dto/track-event.dto';
import { TrackBatchEventsDto } from './dto/track-batch-events.dto';
import { QueryAnalyticsDto } from './dto/query-analytics.dto';
import { ConsentService, ConsentPurpose } from './consent/consent.service';
import {
  IAnalyticsProvider,
  ANALYTICS_PROVIDER,
} from './providers/analytics.provider';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsEventRepository: Repository<AnalyticsEvent>,
    @Optional()
    @Inject(ConsentService)
    private readonly consentService: ConsentService | null,
    @Optional()
    @Inject(ANALYTICS_PROVIDER)
    private readonly analyticsProvider: IAnalyticsProvider | null,
  ) {}

  // ──────────────────────────────────────────────
  // Event tracking
  // ──────────────────────────────────────────────

  async trackEvent(
    userId: string | null,
    dto: TrackEventDto,
    req?: any,
  ): Promise<AnalyticsEvent | null> {
    // Check user consent before tracking
    if (userId && this.consentService) {
      const hasConsent = this.consentService.hasConsent(
        userId,
        ConsentPurpose.ANALYTICS,
      );
      if (!hasConsent) {
        this.logger.debug(
          `User ${userId} has not consented to analytics tracking — skipping`,
        );
        return null;
      }
    }

    const event = this.analyticsEventRepository.create({
      eventName: dto.eventName,
      category: dto.category,
      userId,
      sessionId: dto.sessionId || null,
      properties: dto.properties || null,
      locationId: dto.locationId || null,
      platform: dto.platform || null,
      appVersion: dto.appVersion || null,
      ipAddress: req?.ip || req?.connection?.remoteAddress || null,
      userAgent: req?.headers?.['user-agent'] || null,
      occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
    });

    const saved = await this.analyticsEventRepository.save(event);

    // Forward to external analytics provider (fire-and-forget)
    if (this.analyticsProvider) {
      this.analyticsProvider
        .trackEvent({
          name: dto.eventName,
          userId: userId || undefined,
          properties: {
            ...dto.properties,
            category: dto.category,
            locationId: dto.locationId,
            platform: dto.platform,
          },
        })
        .catch((err) =>
          this.logger.warn(
            `Failed to forward event to analytics provider: ${err.message}`,
          ),
        );
    }

    this.logger.debug(
      `Tracked event "${dto.eventName}" for user ${userId || 'anonymous'}`,
    );

    return saved;
  }

  async trackBatchEvents(
    userId: string | null,
    dto: TrackBatchEventsDto,
    req?: any,
  ): Promise<{ tracked: number; skipped: number }> {
    // Check consent once for the batch
    if (userId && this.consentService) {
      const hasConsent = this.consentService.hasConsent(
        userId,
        ConsentPurpose.ANALYTICS,
      );
      if (!hasConsent) {
        this.logger.debug(
          `User ${userId} has not consented — skipping batch of ${dto.events.length} events`,
        );
        return { tracked: 0, skipped: dto.events.length };
      }
    }

    const entities = dto.events.map((eventDto) =>
      this.analyticsEventRepository.create({
        eventName: eventDto.eventName,
        category: eventDto.category,
        userId,
        sessionId: eventDto.sessionId || null,
        properties: eventDto.properties || null,
        locationId: eventDto.locationId || null,
        platform: eventDto.platform || null,
        appVersion: eventDto.appVersion || null,
        ipAddress: req?.ip || req?.connection?.remoteAddress || null,
        userAgent: req?.headers?.['user-agent'] || null,
        occurredAt: eventDto.occurredAt
          ? new Date(eventDto.occurredAt)
          : new Date(),
      }),
    );

    await this.analyticsEventRepository.save(entities);

    // Forward to external provider (fire-and-forget)
    if (this.analyticsProvider) {
      for (const eventDto of dto.events) {
        this.analyticsProvider
          .trackEvent({
            name: eventDto.eventName,
            userId: userId || undefined,
            properties: {
              ...eventDto.properties,
              category: eventDto.category,
              locationId: eventDto.locationId,
              platform: eventDto.platform,
            },
          })
          .catch((err) =>
            this.logger.warn(
              `Failed to forward batch event to provider: ${err.message}`,
            ),
          );
      }
    }

    this.logger.debug(
      `Batch tracked ${entities.length} events for user ${userId || 'anonymous'}`,
    );

    return { tracked: entities.length, skipped: 0 };
  }

  async trackSystemEvent(
    eventName: string,
    category: AnalyticsEventCategory,
    properties?: Record<string, any>,
  ): Promise<AnalyticsEvent> {
    const event = this.analyticsEventRepository.create({
      eventName,
      category,
      userId: null,
      sessionId: null,
      properties: properties || null,
      locationId: null,
      platform: 'system',
      appVersion: null,
      ipAddress: null,
      userAgent: null,
      occurredAt: new Date(),
    });

    const saved = await this.analyticsEventRepository.save(event);

    this.logger.debug(`Tracked system event "${eventName}"`);

    return saved;
  }

  // ──────────────────────────────────────────────
  // Domain-specific convenience methods
  // ──────────────────────────────────────────────

  async trackUserSignup(userId: string, method: string): Promise<void> {
    await this.trackEvent(userId, {
      eventName: 'user.signup',
      category: AnalyticsEventCategory.USER,
      properties: { method },
    });
  }

  async trackUserLogin(userId: string, method: string): Promise<void> {
    await this.trackEvent(userId, {
      eventName: 'user.login',
      category: AnalyticsEventCategory.USER,
      properties: { method },
    });
  }

  async trackBookingCreated(
    userId: string,
    bookingData: Record<string, any>,
  ): Promise<void> {
    await this.trackEvent(userId, {
      eventName: 'booking.created',
      category: AnalyticsEventCategory.BOOKING,
      properties: bookingData,
      locationId: bookingData?.locationId,
    });
  }

  async trackBookingCompleted(
    userId: string,
    bookingData: Record<string, any>,
  ): Promise<void> {
    await this.trackEvent(userId, {
      eventName: 'booking.completed',
      category: AnalyticsEventCategory.BOOKING,
      properties: bookingData,
      locationId: bookingData?.locationId,
    });
  }

  async trackPaymentCompleted(
    userId: string,
    paymentData: Record<string, any>,
  ): Promise<void> {
    await this.trackEvent(userId, {
      eventName: 'payment.completed',
      category: AnalyticsEventCategory.PAYMENT,
      properties: paymentData,
      locationId: paymentData?.locationId,
    });
  }

  async trackAccessGranted(
    userId: string,
    accessData: Record<string, any>,
  ): Promise<void> {
    await this.trackEvent(userId, {
      eventName: 'access.granted',
      category: AnalyticsEventCategory.ACCESS,
      properties: accessData,
      locationId: accessData?.locationId,
    });
  }

  // ──────────────────────────────────────────────
  // Dashboard / reporting queries
  // ──────────────────────────────────────────────

  async getEventCounts(
    dateFrom: string,
    dateTo: string,
    locationId?: string,
    granularity: string = 'day',
  ): Promise<any[]> {
    const truncExpr = this.getDateTruncExpression(granularity);

    const qb = this.analyticsEventRepository
      .createQueryBuilder('e')
      .select(`e.event_name`, 'eventName')
      .addSelect(`${truncExpr}`, 'period')
      .addSelect('COUNT(*)::int', 'count')
      .where('e.occurred_at >= :dateFrom', { dateFrom })
      .andWhere('e.occurred_at <= :dateTo', { dateTo });

    if (locationId) {
      qb.andWhere('e.location_id = :locationId', { locationId });
    }

    qb.groupBy('e.event_name').addGroupBy('period').orderBy('period', 'ASC');

    return qb.getRawMany();
  }

  async getActiveUsers(
    dateFrom: string,
    dateTo: string,
    granularity: string = 'day',
  ): Promise<any[]> {
    const truncExpr = this.getDateTruncExpression(granularity);

    return this.analyticsEventRepository
      .createQueryBuilder('e')
      .select(`${truncExpr}`, 'period')
      .addSelect('COUNT(DISTINCT e.user_id)::int', 'activeUsers')
      .where('e.occurred_at >= :dateFrom', { dateFrom })
      .andWhere('e.occurred_at <= :dateTo', { dateTo })
      .andWhere('e.user_id IS NOT NULL')
      .groupBy('period')
      .orderBy('period', 'ASC')
      .getRawMany();
  }

  async getUserFunnel(
    dateFrom: string,
    dateTo: string,
    locationId?: string,
  ): Promise<{
    signup: number;
    firstBooking: number;
    firstPayment: number;
    repeatBooking: number;
  }> {
    const baseQb = () => {
      const qb = this.analyticsEventRepository
        .createQueryBuilder('e')
        .where('e.occurred_at >= :dateFrom', { dateFrom })
        .andWhere('e.occurred_at <= :dateTo', { dateTo });

      if (locationId) {
        qb.andWhere('e.location_id = :locationId', { locationId });
      }

      return qb;
    };

    const signupResult = await baseQb()
      .select('COUNT(DISTINCT e.user_id)::int', 'count')
      .andWhere("e.event_name = 'user.signup'")
      .getRawOne();

    const firstBookingResult = await baseQb()
      .select('COUNT(DISTINCT e.user_id)::int', 'count')
      .andWhere("e.event_name = 'booking.created'")
      .getRawOne();

    const firstPaymentResult = await baseQb()
      .select('COUNT(DISTINCT e.user_id)::int', 'count')
      .andWhere("e.event_name = 'payment.completed'")
      .getRawOne();

    const repeatBookingResult = await baseQb()
      .select('e.user_id', 'userId')
      .addSelect('COUNT(*)::int', 'bookingCount')
      .andWhere("e.event_name = 'booking.created'")
      .groupBy('e.user_id')
      .having('COUNT(*) > 1')
      .getRawMany();

    return {
      signup: signupResult?.count || 0,
      firstBooking: firstBookingResult?.count || 0,
      firstPayment: firstPaymentResult?.count || 0,
      repeatBooking: repeatBookingResult?.length || 0,
    };
  }

  async getTopEvents(
    dateFrom: string,
    dateTo: string,
    limit: number = 20,
  ): Promise<any[]> {
    return this.analyticsEventRepository
      .createQueryBuilder('e')
      .select('e.event_name', 'eventName')
      .addSelect('e.category', 'category')
      .addSelect('COUNT(*)::int', 'count')
      .where('e.occurred_at >= :dateFrom', { dateFrom })
      .andWhere('e.occurred_at <= :dateTo', { dateTo })
      .groupBy('e.event_name')
      .addGroupBy('e.category')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async getPlatformBreakdown(
    dateFrom: string,
    dateTo: string,
  ): Promise<any[]> {
    return this.analyticsEventRepository
      .createQueryBuilder('e')
      .select('e.platform', 'platform')
      .addSelect('COUNT(*)::int', 'count')
      .addSelect('COUNT(DISTINCT e.user_id)::int', 'uniqueUsers')
      .where('e.occurred_at >= :dateFrom', { dateFrom })
      .andWhere('e.occurred_at <= :dateTo', { dateTo })
      .groupBy('e.platform')
      .orderBy('count', 'DESC')
      .getRawMany();
  }

  async getLocationBreakdown(
    dateFrom: string,
    dateTo: string,
  ): Promise<any[]> {
    return this.analyticsEventRepository
      .createQueryBuilder('e')
      .select('e.location_id', 'locationId')
      .addSelect('COUNT(*)::int', 'count')
      .addSelect('COUNT(DISTINCT e.user_id)::int', 'uniqueUsers')
      .where('e.occurred_at >= :dateFrom', { dateFrom })
      .andWhere('e.occurred_at <= :dateTo', { dateTo })
      .andWhere('e.location_id IS NOT NULL')
      .groupBy('e.location_id')
      .orderBy('count', 'DESC')
      .getRawMany();
  }

  // ──────────────────────────────────────────────
  // Admin event listing
  // ──────────────────────────────────────────────

  async findAll(
    query: QueryAnalyticsDto,
  ): Promise<{ data: AnalyticsEvent[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const qb = this.analyticsEventRepository.createQueryBuilder('e');

    if (query.eventName) {
      qb.andWhere('e.event_name = :eventName', {
        eventName: query.eventName,
      });
    }

    if (query.category) {
      qb.andWhere('e.category = :category', { category: query.category });
    }

    if (query.userId) {
      qb.andWhere('e.user_id = :userId', { userId: query.userId });
    }

    if (query.locationId) {
      qb.andWhere('e.location_id = :locationId', {
        locationId: query.locationId,
      });
    }

    if (query.platform) {
      qb.andWhere('e.platform = :platform', { platform: query.platform });
    }

    if (query.dateFrom) {
      qb.andWhere('e.occurred_at >= :dateFrom', { dateFrom: query.dateFrom });
    }

    if (query.dateTo) {
      qb.andWhere('e.occurred_at <= :dateTo', { dateTo: query.dateTo });
    }

    qb.orderBy('e.occurred_at', 'DESC').skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  // ──────────────────────────────────────────────
  // GDPR
  // ──────────────────────────────────────────────

  async exportUserAnalytics(
    userId: string,
  ): Promise<{ events: AnalyticsEvent[]; exportedAt: string }> {
    const events = await this.analyticsEventRepository.find({
      where: { userId },
      order: { occurredAt: 'DESC' },
    });

    this.logger.log(
      `GDPR export: ${events.length} analytics events exported for user ${userId}`,
    );

    return {
      events,
      exportedAt: new Date().toISOString(),
    };
  }

  async deleteUserAnalytics(
    userId: string,
  ): Promise<{ deleted: number; deletedAt: string }> {
    const result = await this.analyticsEventRepository.delete({ userId });

    this.logger.log(
      `GDPR deletion: ${result.affected || 0} analytics events deleted for user ${userId}`,
    );

    return {
      deleted: result.affected || 0,
      deletedAt: new Date().toISOString(),
    };
  }

  // ──────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────

  private getDateTruncExpression(granularity: string): string {
    const validGranularities = ['hour', 'day', 'week', 'month'];
    const gran = validGranularities.includes(granularity)
      ? granularity
      : 'day';

    return `date_trunc('${gran}', e.occurred_at)`;
  }
}
