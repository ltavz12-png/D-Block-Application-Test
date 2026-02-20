import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from '@/common/database/entities/location.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { QueryLocationDto } from './dto/query-location.dto';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
  ) {}

  async findAll(query: QueryLocationDto): Promise<{
    data: Location[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { city, isActive, page = 1, limit = 20, search } = query;

    const qb = this.locationRepository.createQueryBuilder('location');

    if (city) {
      qb.andWhere('location.city = :city', { city });
    }

    if (isActive !== undefined) {
      qb.andWhere('location.isActive = :isActive', { isActive });
    }

    if (search) {
      qb.andWhere(
        '(location.name ILIKE :search OR location.city ILIKE :search OR location.address ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.orderBy('location.createdAt', 'DESC');
    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  async findById(id: string): Promise<Location> {
    const location = await this.locationRepository.findOne({
      where: { id },
      relations: ['resources'],
    });

    if (!location) {
      throw new NotFoundException(`Location with ID "${id}" not found`);
    }

    return location;
  }

  async findActive(): Promise<Location[]> {
    return this.locationRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async create(dto: CreateLocationDto, userId: string): Promise<Location> {
    const location = this.locationRepository.create({
      ...dto,
      createdBy: userId,
    });

    return this.locationRepository.save(location);
  }

  async update(
    id: string,
    dto: UpdateLocationDto,
    userId: string,
  ): Promise<Location> {
    const location = await this.findById(id);

    Object.assign(location, dto, { updatedBy: userId });

    return this.locationRepository.save(location);
  }

  async remove(id: string): Promise<void> {
    const location = await this.findById(id);
    await this.locationRepository.softRemove(location);
  }

  async getResourceCounts(
    locationId: string,
  ): Promise<{ type: string; count: number }[]> {
    const result = await this.locationRepository.manager
      .createQueryBuilder()
      .select('resource.resource_type', 'type')
      .addSelect('COUNT(*)::int', 'count')
      .from('resources', 'resource')
      .where('resource.location_id = :locationId', { locationId })
      .andWhere('resource.deleted_at IS NULL')
      .groupBy('resource.resource_type')
      .getRawMany();

    return result;
  }
}
