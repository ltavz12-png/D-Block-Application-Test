import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Optional,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThanOrEqual, In } from 'typeorm';
import { Visitor, VisitorStatus } from '@/common/database/entities/visitor.entity';
import { CreateVisitorDto } from './dto/create-visitor.dto';
import { UpdateVisitorDto } from './dto/update-visitor.dto';
import { QueryVisitorsDto } from './dto/query-visitors.dto';
import { EmailsService } from '@/modules/emails/emails.service';

@Injectable()
export class VisitorsService {
  private readonly logger = new Logger(VisitorsService.name);

  constructor(
    @InjectRepository(Visitor)
    private readonly visitorRepo: Repository<Visitor>,
    @Optional()
    @Inject(EmailsService)
    private readonly emailsService: EmailsService | null,
  ) {}

  async inviteVisitor(hostUserId: string, dto: CreateVisitorDto): Promise<Visitor> {
    const visitor = this.visitorRepo.create({
      hostUserId,
      locationId: dto.locationId,
      visitorName: dto.visitorName,
      visitorEmail: dto.visitorEmail || null,
      visitorPhone: dto.visitorPhone || null,
      visitorCompany: dto.visitorCompany || null,
      purpose: dto.purpose || null,
      expectedDate: dto.expectedDate as any,
      expectedTime: dto.expectedTime || null,
      status: VisitorStatus.EXPECTED,
      notificationSent: false,
    });

    const saved = await this.visitorRepo.save(visitor);

    if (dto.visitorEmail && this.emailsService) {
      try {
        const visitorWithRelations = await this.visitorRepo.findOne({
          where: { id: saved.id },
          relations: ['hostUser', 'location'],
        });

        const hostName = visitorWithRelations?.hostUser
          ? `${visitorWithRelations.hostUser.firstName} ${visitorWithRelations.hostUser.lastName}`
          : 'Your host';
        const locationName = visitorWithRelations?.location?.name || 'D Block Workspace';
        const locationAddress = visitorWithRelations?.location?.address || 'Tbilisi, Georgia';

        await this.emailsService.sendVisitorInvitation(
          { email: dto.visitorEmail, name: dto.visitorName },
          {
            visitorName: dto.visitorName,
            hostName,
            locationName,
            locationAddress,
            date: dto.expectedDate,
            time: dto.expectedTime,
            purpose: dto.purpose,
          },
          'en',
          hostUserId,
        );

        saved.notificationSent = true;
        await this.visitorRepo.save(saved);
      } catch (error) {
        this.logger.error(
          `Failed to send visitor invitation email: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    } else if (dto.visitorEmail && !this.emailsService) {
      this.logger.warn('EmailsService not available — skipping visitor invitation email');
    }

    return saved;
  }

  async updateVisitor(
    id: string,
    hostUserId: string,
    dto: UpdateVisitorDto,
  ): Promise<Visitor> {
    const visitor = await this.visitorRepo.findOne({ where: { id } });

    if (!visitor) {
      throw new NotFoundException(`Visitor with ID ${id} not found`);
    }

    if (visitor.hostUserId !== hostUserId) {
      throw new ForbiddenException('Only the host can update visitor details');
    }

    if (visitor.status !== VisitorStatus.EXPECTED) {
      throw new BadRequestException('Can only update visitors with EXPECTED status');
    }

    Object.assign(visitor, {
      ...(dto.locationId !== undefined && { locationId: dto.locationId }),
      ...(dto.visitorName !== undefined && { visitorName: dto.visitorName }),
      ...(dto.visitorEmail !== undefined && { visitorEmail: dto.visitorEmail }),
      ...(dto.visitorPhone !== undefined && { visitorPhone: dto.visitorPhone }),
      ...(dto.visitorCompany !== undefined && { visitorCompany: dto.visitorCompany }),
      ...(dto.purpose !== undefined && { purpose: dto.purpose }),
      ...(dto.expectedDate !== undefined && { expectedDate: dto.expectedDate }),
      ...(dto.expectedTime !== undefined && { expectedTime: dto.expectedTime }),
    });

    return this.visitorRepo.save(visitor);
  }

  async cancelVisitor(id: string, hostUserId: string): Promise<Visitor> {
    const visitor = await this.visitorRepo.findOne({ where: { id } });

    if (!visitor) {
      throw new NotFoundException(`Visitor with ID ${id} not found`);
    }

    if (visitor.hostUserId !== hostUserId) {
      throw new ForbiddenException('Only the host can cancel a visitor invitation');
    }

    if (
      visitor.status !== VisitorStatus.EXPECTED
    ) {
      throw new BadRequestException('Can only cancel visitors with EXPECTED status');
    }

    visitor.status = VisitorStatus.CANCELLED;
    return this.visitorRepo.save(visitor);
  }

  async checkInVisitor(id: string): Promise<Visitor> {
    const visitor = await this.visitorRepo.findOne({ where: { id } });

    if (!visitor) {
      throw new NotFoundException(`Visitor with ID ${id} not found`);
    }

    if (visitor.status !== VisitorStatus.EXPECTED) {
      throw new BadRequestException('Can only check in visitors with EXPECTED status');
    }

    visitor.status = VisitorStatus.CHECKED_IN;
    visitor.checkedInAt = new Date();
    return this.visitorRepo.save(visitor);
  }

  async checkOutVisitor(id: string): Promise<Visitor> {
    const visitor = await this.visitorRepo.findOne({ where: { id } });

    if (!visitor) {
      throw new NotFoundException(`Visitor with ID ${id} not found`);
    }

    if (visitor.status !== VisitorStatus.CHECKED_IN) {
      throw new BadRequestException('Can only check out visitors with CHECKED_IN status');
    }

    visitor.status = VisitorStatus.CHECKED_OUT;
    visitor.checkedOutAt = new Date();
    return this.visitorRepo.save(visitor);
  }

  async markNoShow(id: string): Promise<Visitor> {
    const visitor = await this.visitorRepo.findOne({ where: { id } });

    if (!visitor) {
      throw new NotFoundException(`Visitor with ID ${id} not found`);
    }

    if (visitor.status !== VisitorStatus.EXPECTED) {
      throw new BadRequestException('Can only mark no-show for visitors with EXPECTED status');
    }

    visitor.status = VisitorStatus.NO_SHOW;
    return this.visitorRepo.save(visitor);
  }

  async findAll(
    query: QueryVisitorsDto,
  ): Promise<{ data: Visitor[]; total: number; page: number; limit: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.visitorRepo
      .createQueryBuilder('visitor')
      .leftJoinAndSelect('visitor.hostUser', 'hostUser')
      .leftJoinAndSelect('visitor.location', 'location');

    if (query.hostUserId) {
      qb.andWhere('visitor.hostUserId = :hostUserId', {
        hostUserId: query.hostUserId,
      });
    }

    if (query.locationId) {
      qb.andWhere('visitor.locationId = :locationId', {
        locationId: query.locationId,
      });
    }

    if (query.status) {
      qb.andWhere('visitor.status = :status', { status: query.status });
    }

    if (query.dateFrom) {
      qb.andWhere('visitor.expectedDate >= :dateFrom', {
        dateFrom: query.dateFrom,
      });
    }

    if (query.dateTo) {
      qb.andWhere('visitor.expectedDate <= :dateTo', {
        dateTo: query.dateTo,
      });
    }

    if (query.search) {
      qb.andWhere(
        '(visitor.visitorName ILIKE :search OR visitor.visitorEmail ILIKE :search OR visitor.visitorCompany ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('visitor.expectedDate', 'DESC')
      .addOrderBy('visitor.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  async findById(id: string): Promise<Visitor> {
    const visitor = await this.visitorRepo.findOne({
      where: { id },
      relations: ['hostUser', 'location'],
    });

    if (!visitor) {
      throw new NotFoundException(`Visitor with ID ${id} not found`);
    }

    return visitor;
  }

  async findMyVisitors(
    hostUserId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: Visitor[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.visitorRepo.findAndCount({
      where: { hostUserId },
      relations: ['location'],
      order: { expectedDate: 'DESC', createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findTodaysVisitors(locationId: string): Promise<Visitor[]> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    return this.visitorRepo
      .createQueryBuilder('visitor')
      .leftJoinAndSelect('visitor.hostUser', 'hostUser')
      .leftJoinAndSelect('visitor.location', 'location')
      .where('visitor.locationId = :locationId', { locationId })
      .andWhere('visitor.expectedDate = :today', { today: dateStr })
      .andWhere('visitor.status IN (:...statuses)', {
        statuses: [VisitorStatus.EXPECTED, VisitorStatus.CHECKED_IN],
      })
      .orderBy('visitor.expectedTime', 'ASC', 'NULLS LAST')
      .addOrderBy('visitor.visitorName', 'ASC')
      .getMany();
  }

  async getVisitorStats(
    locationId: string,
  ): Promise<{
    expectedToday: number;
    checkedInToday: number;
    totalThisWeek: number;
    noShowRate: number;
  }> {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    const mondayStr = monday.toISOString().split('T')[0];

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const sundayStr = sunday.toISOString().split('T')[0];

    const expectedToday = await this.visitorRepo
      .createQueryBuilder('visitor')
      .where('visitor.locationId = :locationId', { locationId })
      .andWhere('visitor.expectedDate = :today', { today: dateStr })
      .andWhere('visitor.status = :status', { status: VisitorStatus.EXPECTED })
      .getCount();

    const checkedInToday = await this.visitorRepo
      .createQueryBuilder('visitor')
      .where('visitor.locationId = :locationId', { locationId })
      .andWhere('visitor.expectedDate = :today', { today: dateStr })
      .andWhere('visitor.status = :status', { status: VisitorStatus.CHECKED_IN })
      .getCount();

    const totalThisWeek = await this.visitorRepo
      .createQueryBuilder('visitor')
      .where('visitor.locationId = :locationId', { locationId })
      .andWhere('visitor.expectedDate >= :monday', { monday: mondayStr })
      .andWhere('visitor.expectedDate <= :sunday', { sunday: sundayStr })
      .getCount();

    const totalPastVisitors = await this.visitorRepo
      .createQueryBuilder('visitor')
      .where('visitor.locationId = :locationId', { locationId })
      .andWhere('visitor.expectedDate < :today', { today: dateStr })
      .andWhere('visitor.status IN (:...statuses)', {
        statuses: [
          VisitorStatus.CHECKED_IN,
          VisitorStatus.CHECKED_OUT,
          VisitorStatus.NO_SHOW,
        ],
      })
      .getCount();

    const noShowCount = await this.visitorRepo
      .createQueryBuilder('visitor')
      .where('visitor.locationId = :locationId', { locationId })
      .andWhere('visitor.expectedDate < :today', { today: dateStr })
      .andWhere('visitor.status = :status', { status: VisitorStatus.NO_SHOW })
      .getCount();

    const noShowRate =
      totalPastVisitors > 0
        ? Math.round((noShowCount / totalPastVisitors) * 10000) / 100
        : 0;

    return { expectedToday, checkedInToday, totalThisWeek, noShowRate };
  }

  async checkNoShowVisitors(): Promise<number> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const result = await this.visitorRepo
      .createQueryBuilder()
      .update(Visitor)
      .set({ status: VisitorStatus.NO_SHOW })
      .where('expectedDate <= :yesterday', { yesterday: yesterdayStr })
      .andWhere('status = :status', { status: VisitorStatus.EXPECTED })
      .execute();

    const affected = result.affected || 0;

    if (affected > 0) {
      this.logger.log(
        `Marked ${affected} visitors as NO_SHOW for dates up to ${yesterdayStr}`,
      );
    }

    return affected;
  }
}
