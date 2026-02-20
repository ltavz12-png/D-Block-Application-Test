import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  AccessKey,
  AccessKeyStatus,
  AccessLevel,
} from '@/common/database/entities/access-key.entity';
import {
  AccessLog,
  AccessMethod,
  AccessDirection,
} from '@/common/database/entities/access-log.entity';
import { SaltoKsGateway } from './gateways/salto-ks.gateway';
import { GrantAccessDto } from './dto/grant-access.dto';
import { QueryAccessKeysDto } from './dto/query-access-keys.dto';
import { QueryAccessLogsDto } from './dto/query-access-logs.dto';

@Injectable()
export class AccessService {
  private readonly logger = new Logger(AccessService.name);

  constructor(
    @InjectRepository(AccessKey)
    private readonly accessKeyRepository: Repository<AccessKey>,
    @InjectRepository(AccessLog)
    private readonly accessLogRepository: Repository<AccessLog>,
    private readonly saltoKsGateway: SaltoKsGateway,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Determines the SaltoKS access group name based on locationId and accessLevel.
   * In a production system, this mapping would come from a database or configuration.
   */
  private async resolveAccessGroupId(
    locationId: string,
    accessLevel: AccessLevel,
  ): Promise<string> {
    const groups = await this.saltoKsGateway.listAccessGroups();

    // Build a simple heuristic: match group name containing location-related keyword
    // and access-level keyword (Common Areas vs All Areas)
    const isAllAreas =
      accessLevel === AccessLevel.ALL_AREAS ||
      accessLevel === AccessLevel.OFFICE ||
      accessLevel === AccessLevel.DEDICATED_BOX;

    const suffix = isAllAreas ? 'All Areas' : 'Common Areas';

    // Try to find a matching group
    const matchedGroup = groups.find((g) =>
      g.name.toLowerCase().includes(suffix.toLowerCase()),
    );

    if (matchedGroup) {
      return matchedGroup.id;
    }

    // Fallback to first available group
    if (groups.length > 0) {
      this.logger.warn(
        `No matching access group for location ${locationId} / level ${accessLevel}, using first available group`,
      );
      return groups[0].id;
    }

    throw new BadRequestException(
      'No SaltoKS access groups available for the specified location and access level',
    );
  }

  async grantAccess(dto: GrantAccessDto): Promise<AccessKey> {
    const validFrom = new Date(dto.validFrom);
    const validUntil = dto.validUntil ? new Date(dto.validUntil) : null;

    // Resolve access group for SaltoKS
    const accessGroupId = await this.resolveAccessGroupId(
      dto.locationId,
      dto.accessLevel,
    );

    // Issue key via SaltoKS
    const saltoKey = await this.saltoKsGateway.issueKey(
      dto.userId,
      accessGroupId,
      validFrom,
      validUntil ?? undefined,
    );

    // Create local access key record
    const accessKey = this.accessKeyRepository.create({
      userId: dto.userId,
      saltoKeyId: saltoKey.id,
      accessLevel: dto.accessLevel,
      locationId: dto.locationId,
      resourceIds: dto.resourceIds ?? [],
      status: AccessKeyStatus.ACTIVE,
      validFrom,
      validUntil,
      sourceType: dto.sourceType,
      sourceId: dto.sourceId,
      isVisitorKey: false,
      timeRestrictions: dto.timeRestrictions ?? null,
    });

    const saved = await this.accessKeyRepository.save(accessKey);
    this.logger.log(
      `Granted access key ${saved.id} to user ${dto.userId} at location ${dto.locationId}`,
    );

    return saved;
  }

  async revokeAccess(keyId: string, reason?: string): Promise<AccessKey> {
    const accessKey = await this.accessKeyRepository.findOne({
      where: { id: keyId },
    });

    if (!accessKey) {
      throw new NotFoundException(`Access key ${keyId} not found`);
    }

    if (accessKey.status === AccessKeyStatus.REVOKED) {
      throw new BadRequestException(`Access key ${keyId} is already revoked`);
    }

    // Revoke in SaltoKS if we have a Salto key ID
    if (accessKey.saltoKeyId) {
      try {
        await this.saltoKsGateway.revokeKey(accessKey.saltoKeyId);
      } catch (error) {
        this.logger.error(
          `Failed to revoke SaltoKS key ${accessKey.saltoKeyId}: ${error}`,
        );
        // Continue with local revocation even if SaltoKS fails
      }
    }

    accessKey.status = AccessKeyStatus.REVOKED;
    const saved = await this.accessKeyRepository.save(accessKey);
    this.logger.log(`Revoked access key ${keyId}${reason ? `: ${reason}` : ''}`);

    return saved;
  }

  async suspendAccess(keyId: string): Promise<AccessKey> {
    const accessKey = await this.accessKeyRepository.findOne({
      where: { id: keyId },
    });

    if (!accessKey) {
      throw new NotFoundException(`Access key ${keyId} not found`);
    }

    if (accessKey.status !== AccessKeyStatus.ACTIVE) {
      throw new BadRequestException(
        `Access key ${keyId} cannot be suspended from status ${accessKey.status}`,
      );
    }

    accessKey.status = AccessKeyStatus.SUSPENDED;
    const saved = await this.accessKeyRepository.save(accessKey);
    this.logger.log(`Suspended access key ${keyId}`);

    return saved;
  }

  async reactivateAccess(keyId: string): Promise<AccessKey> {
    const accessKey = await this.accessKeyRepository.findOne({
      where: { id: keyId },
    });

    if (!accessKey) {
      throw new NotFoundException(`Access key ${keyId} not found`);
    }

    if (accessKey.status !== AccessKeyStatus.SUSPENDED) {
      throw new BadRequestException(
        `Access key ${keyId} cannot be reactivated from status ${accessKey.status}`,
      );
    }

    accessKey.status = AccessKeyStatus.ACTIVE;
    const saved = await this.accessKeyRepository.save(accessKey);
    this.logger.log(`Reactivated access key ${keyId}`);

    return saved;
  }

  async grantBookingAccess(
    bookingId: string,
    userId: string,
    resourceId: string,
    locationId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<AccessKey> {
    const dto: GrantAccessDto = {
      userId,
      locationId,
      accessLevel: AccessLevel.BOOKED_ROOMS,
      resourceIds: [resourceId],
      sourceType: 'booking',
      sourceId: bookingId,
      validFrom: startTime.toISOString(),
      validUntil: endTime.toISOString(),
    };

    return this.grantAccess(dto);
  }

  async grantVisitorAccess(
    visitorId: string,
    locationId: string,
    validFrom: Date,
    validUntil: Date,
  ): Promise<AccessKey> {
    // Resolve access group for common areas
    const accessGroupId = await this.resolveAccessGroupId(
      locationId,
      AccessLevel.COMMON_AREAS,
    );

    // Issue key via SaltoKS
    const saltoKey = await this.saltoKsGateway.issueKey(
      visitorId,
      accessGroupId,
      validFrom,
      validUntil,
    );

    const accessKey = this.accessKeyRepository.create({
      userId: visitorId,
      saltoKeyId: saltoKey.id,
      accessLevel: AccessLevel.COMMON_AREAS,
      locationId,
      resourceIds: [],
      status: AccessKeyStatus.ACTIVE,
      validFrom,
      validUntil,
      sourceType: 'visitor',
      sourceId: visitorId,
      isVisitorKey: true,
      timeRestrictions: null,
    });

    const saved = await this.accessKeyRepository.save(accessKey);
    this.logger.log(
      `Granted visitor access key ${saved.id} for visitor ${visitorId} at location ${locationId}`,
    );

    return saved;
  }

  async revokeBookingAccess(bookingId: string): Promise<void> {
    const accessKey = await this.accessKeyRepository.findOne({
      where: {
        sourceType: 'booking',
        sourceId: bookingId,
        status: AccessKeyStatus.ACTIVE,
      },
    });

    if (!accessKey) {
      this.logger.warn(
        `No active access key found for booking ${bookingId}`,
      );
      return;
    }

    await this.revokeAccess(accessKey.id, 'Booking cancelled or ended');
  }

  async revokeVisitorAccess(visitorId: string): Promise<void> {
    const accessKey = await this.accessKeyRepository.findOne({
      where: {
        sourceType: 'visitor',
        sourceId: visitorId,
        status: AccessKeyStatus.ACTIVE,
        isVisitorKey: true,
      },
    });

    if (!accessKey) {
      this.logger.warn(
        `No active visitor access key found for visitor ${visitorId}`,
      );
      return;
    }

    await this.revokeAccess(accessKey.id, 'Visitor checkout');
  }

  async findAccessKeys(
    query: QueryAccessKeysDto,
  ): Promise<{ data: AccessKey[]; total: number; page: number; limit: number }> {
    const qb = this.accessKeyRepository.createQueryBuilder('ak');

    if (query.userId) {
      qb.andWhere('ak.userId = :userId', { userId: query.userId });
    }

    if (query.locationId) {
      qb.andWhere('ak.locationId = :locationId', {
        locationId: query.locationId,
      });
    }

    if (query.status) {
      qb.andWhere('ak.status = :status', { status: query.status });
    }

    if (query.sourceType) {
      qb.andWhere('ak.sourceType = :sourceType', {
        sourceType: query.sourceType,
      });
    }

    if (query.isVisitorKey !== undefined) {
      qb.andWhere('ak.isVisitorKey = :isVisitorKey', {
        isVisitorKey: query.isVisitorKey,
      });
    }

    qb.orderBy('ak.createdAt', 'DESC');

    const page = query.page;
    const limit = query.limit;
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  async findAccessLogs(
    query: QueryAccessLogsDto,
  ): Promise<{ data: AccessLog[]; total: number; page: number; limit: number }> {
    const qb = this.accessLogRepository.createQueryBuilder('al');

    if (query.userId) {
      qb.andWhere('al.userId = :userId', { userId: query.userId });
    }

    if (query.locationId) {
      qb.andWhere('al.locationId = :locationId', {
        locationId: query.locationId,
      });
    }

    if (query.method) {
      qb.andWhere('al.method = :method', { method: query.method });
    }

    if (query.granted !== undefined) {
      qb.andWhere('al.granted = :granted', { granted: query.granted });
    }

    if (query.dateFrom) {
      qb.andWhere('al.createdAt >= :dateFrom', {
        dateFrom: new Date(query.dateFrom),
      });
    }

    if (query.dateTo) {
      qb.andWhere('al.createdAt <= :dateTo', {
        dateTo: new Date(query.dateTo),
      });
    }

    qb.orderBy('al.createdAt', 'DESC');

    const page = query.page;
    const limit = query.limit;
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  async getUserActiveKeys(userId: string): Promise<AccessKey[]> {
    return this.accessKeyRepository.find({
      where: {
        userId,
        status: AccessKeyStatus.ACTIVE,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findAccessKeyById(keyId: string): Promise<AccessKey> {
    const accessKey = await this.accessKeyRepository.findOne({
      where: { id: keyId },
    });

    if (!accessKey) {
      throw new NotFoundException(`Access key ${keyId} not found`);
    }

    return accessKey;
  }

  async checkExpiredKeys(): Promise<number> {
    const now = new Date();

    const result = await this.accessKeyRepository
      .createQueryBuilder()
      .update(AccessKey)
      .set({ status: AccessKeyStatus.EXPIRED })
      .where('status = :activeStatus', {
        activeStatus: AccessKeyStatus.ACTIVE,
      })
      .andWhere('validUntil IS NOT NULL')
      .andWhere('validUntil <= :now', { now })
      .execute();

    const affected = result.affected ?? 0;

    if (affected > 0) {
      this.logger.log(`Expired ${affected} access keys`);
    }

    return affected;
  }

  async syncSaltoEvents(since?: Date): Promise<number> {
    const sinceDate = since ?? new Date(Date.now() - 24 * 60 * 60 * 1000); // Default: last 24 hours

    const events = await this.saltoKsGateway.getRecentEvents(sinceDate);

    let synced = 0;

    for (const event of events) {
      // Check if this event has already been synced
      const existing = await this.accessLogRepository.findOne({
        where: { saltoEventId: event.id },
      });

      if (existing) {
        continue;
      }

      // Map SaltoKS method strings to our AccessMethod enum
      const methodMap: Record<string, AccessMethod> = {
        ble: AccessMethod.BLE,
        nfc: AccessMethod.NFC,
        pin: AccessMethod.PIN,
        qr_code: AccessMethod.QR_CODE,
        manual: AccessMethod.MANUAL,
      };

      const directionMap: Record<string, AccessDirection> = {
        entry: AccessDirection.ENTRY,
        exit: AccessDirection.EXIT,
      };

      const accessLog = this.accessLogRepository.create({
        userId: event.userId ?? null,
        locationId: this.extractLocationFromDoor(event.doorId),
        resourceId: null,
        doorId: event.doorId,
        method: methodMap[event.method] ?? AccessMethod.MANUAL,
        direction: directionMap[event.direction] ?? null,
        granted: event.granted,
        denialReason: event.granted ? null : 'Denied by SaltoKS',
        saltoEventId: event.id,
      });

      await this.accessLogRepository.save(accessLog);
      synced++;
    }

    this.logger.log(
      `Synced ${synced} SaltoKS events (${events.length} total fetched since ${sinceDate.toISOString()})`,
    );

    return synced;
  }

  /**
   * Extracts a location identifier from a door ID.
   * In mock mode, door IDs are formatted as "door-{location}-{area}".
   * In production, this would use a door-to-location mapping table.
   */
  private extractLocationFromDoor(doorId: string): string {
    // For mock mode, the doorId format is "door-stamba-main" etc.
    // We return a placeholder UUID; in production, this would be a real location lookup.
    // For now, return a deterministic UUID based on the door prefix
    const parts = doorId.split('-');
    if (parts.length >= 2) {
      const locationPrefix = parts[1];
      // Use a simple hash-like approach for a deterministic but valid-looking UUID placeholder
      const hash = locationPrefix
        .split('')
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const hexHash = hash.toString(16).padStart(8, '0');
      return `${hexHash}-0000-4000-8000-000000000000`;
    }
    return '00000000-0000-4000-8000-000000000000';
  }

  async getAccessStats(
    locationId: string,
  ): Promise<{
    activeKeys: number;
    totalEntriesToday: number;
    uniqueUsersToday: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeKeys = await this.accessKeyRepository.count({
      where: {
        locationId,
        status: AccessKeyStatus.ACTIVE,
      },
    });

    const entriesResult = await this.accessLogRepository
      .createQueryBuilder('al')
      .select('COUNT(*)', 'totalEntries')
      .addSelect('COUNT(DISTINCT al.userId)', 'uniqueUsers')
      .where('al.locationId = :locationId', { locationId })
      .andWhere('al.createdAt >= :today', { today })
      .andWhere('al.granted = :granted', { granted: true })
      .getRawOne();

    return {
      activeKeys,
      totalEntriesToday: parseInt(entriesResult?.totalEntries ?? '0', 10),
      uniqueUsersToday: parseInt(entriesResult?.uniqueUsers ?? '0', 10),
    };
  }
}
