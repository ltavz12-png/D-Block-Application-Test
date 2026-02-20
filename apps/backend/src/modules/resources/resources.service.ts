import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resource, ResourceType } from '@/common/database/entities/resource.entity';
import { Booking, BookingStatus } from '@/common/database/entities/booking.entity';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { QueryResourceDto } from './dto/query-resource.dto';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  async findAll(query: QueryResourceDto): Promise<{
    data: Resource[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      locationId,
      resourceType,
      isActive,
      isBookable,
      page = 1,
      limit = 20,
      search,
      minCapacity,
      pricingModel,
    } = query;

    const qb = this.resourceRepository
      .createQueryBuilder('resource')
      .leftJoinAndSelect('resource.location', 'location');

    if (locationId) {
      qb.andWhere('resource.locationId = :locationId', { locationId });
    }

    if (resourceType) {
      qb.andWhere('resource.resourceType = :resourceType', { resourceType });
    }

    if (isActive !== undefined) {
      qb.andWhere('resource.isActive = :isActive', { isActive });
    }

    if (isBookable !== undefined) {
      qb.andWhere('resource.isBookable = :isBookable', { isBookable });
    }

    if (search) {
      qb.andWhere('resource.name ILIKE :search', { search: `%${search}%` });
    }

    if (minCapacity !== undefined) {
      qb.andWhere('resource.capacity >= :minCapacity', { minCapacity });
    }

    if (pricingModel) {
      qb.andWhere('resource.pricingModel = :pricingModel', { pricingModel });
    }

    qb.orderBy('resource.createdAt', 'DESC');
    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  async findById(id: string): Promise<Resource> {
    const resource = await this.resourceRepository.findOne({
      where: { id },
      relations: ['location'],
    });

    if (!resource) {
      throw new NotFoundException(`Resource with ID "${id}" not found`);
    }

    return resource;
  }

  async findByLocation(
    locationId: string,
    type?: ResourceType,
  ): Promise<Resource[]> {
    const where: Record<string, any> = {
      locationId,
      isActive: true,
      isBookable: true,
    };

    if (type) {
      where.resourceType = type;
    }

    return this.resourceRepository.find({
      where,
      relations: ['location'],
      order: { name: 'ASC' },
    });
  }

  async findAvailableForTimeRange(
    locationId: string,
    type: ResourceType,
    startTime: Date,
    endTime: Date,
  ): Promise<Resource[]> {
    return this.resourceRepository
      .createQueryBuilder('resource')
      .leftJoin(
        'resource.bookings',
        'booking',
        `booking.status NOT IN (:...excludedStatuses)
         AND booking.startTime < :endTime
         AND booking.endTime > :startTime`,
        {
          excludedStatuses: [BookingStatus.CANCELLED, BookingStatus.NO_SHOW],
          endTime,
          startTime,
        },
      )
      .where('resource.locationId = :locationId', { locationId })
      .andWhere('resource.resourceType = :type', { type })
      .andWhere('resource.isActive = true')
      .andWhere('resource.isBookable = true')
      .groupBy('resource.id')
      .having('COUNT(booking.id) = 0')
      .orderBy('resource.name', 'ASC')
      .getMany();
  }

  async create(dto: CreateResourceDto, userId: string): Promise<Resource> {
    const resource = this.resourceRepository.create({
      ...dto,
      createdBy: userId,
    });

    return this.resourceRepository.save(resource);
  }

  async update(
    id: string,
    dto: UpdateResourceDto,
    userId: string,
  ): Promise<Resource> {
    const resource = await this.findById(id);

    Object.assign(resource, dto, { updatedBy: userId });

    return this.resourceRepository.save(resource);
  }

  async remove(id: string): Promise<void> {
    const resource = await this.findById(id);
    await this.resourceRepository.softRemove(resource);
  }

  async getAvailabilitySlots(
    resourceId: string,
    date: Date,
  ): Promise<{ start: string; end: string }[]> {
    const resource = await this.findById(resourceId);

    const dayOfWeek = date.getDay();
    const rules = resource.availabilityRules;

    if (!rules || rules.length === 0) {
      return [];
    }

    const dayRule = rules.find((r) => r.dayOfWeek === dayOfWeek);
    if (!dayRule) {
      return [];
    }

    const bufferMinutes = resource.bookingRules?.bufferMinutes ?? 0;

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Query bookings for the specific day that are not cancelled/no_show
    const dayBookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .where('booking.resourceId = :resourceId', { resourceId })
      .andWhere('booking.startTime < :endOfDay', { endOfDay })
      .andWhere('booking.endTime > :startOfDay', { startOfDay })
      .andWhere('booking.status NOT IN (:...excludedStatuses)', {
        excludedStatuses: [BookingStatus.CANCELLED, BookingStatus.NO_SHOW],
      })
      .orderBy('booking.startTime', 'ASC')
      .getMany();

    const openMinutes = this.timeToMinutes(dayRule.openTime);
    const closeMinutes = this.timeToMinutes(dayRule.closeTime);

    // Convert bookings to minute intervals with buffer
    const occupiedSlots = dayBookings.map((b) => {
      const bStart = b.startTime.getHours() * 60 + b.startTime.getMinutes();
      const bEnd = b.endTime.getHours() * 60 + b.endTime.getMinutes();
      return {
        start: bStart - bufferMinutes,
        end: bEnd + bufferMinutes,
      };
    });

    // Build free slots
    const freeSlots: { start: string; end: string }[] = [];
    let cursor = openMinutes;

    for (const slot of occupiedSlots) {
      if (cursor < slot.start) {
        freeSlots.push({
          start: this.minutesToTime(cursor),
          end: this.minutesToTime(Math.min(slot.start, closeMinutes)),
        });
      }
      cursor = Math.max(cursor, slot.end);
    }

    if (cursor < closeMinutes) {
      freeSlots.push({
        start: this.minutesToTime(cursor),
        end: this.minutesToTime(closeMinutes),
      });
    }

    return freeSlots;
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
