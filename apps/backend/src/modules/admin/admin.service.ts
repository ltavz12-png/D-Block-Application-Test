import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { User } from '@/common/database/entities/user.entity';
import { Booking, BookingStatus } from '@/common/database/entities/booking.entity';
import { Payment } from '@/common/database/entities/payment.entity';
import { Resource } from '@/common/database/entities/resource.entity';
import { Location } from '@/common/database/entities/location.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Resource) private readonly resourceRepo: Repository<Resource>,
    @InjectRepository(Location) private readonly locationRepo: Repository<Location>,
  ) {}

  async getDashboardStats() {
    const totalUsers = await this.userRepo.count();
    const totalBookings = await this.bookingRepo.count();
    const totalResources = await this.resourceRepo.count();
    const totalLocations = await this.locationRepo.count();

    const activeBookings = await this.bookingRepo.count({
      where: { status: BookingStatus.CONFIRMED },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayBookings = await this.bookingRepo.count({
      where: { startTime: Between(today, tomorrow) },
    });

    // Revenue calculation
    const revenueResult = await this.paymentRepo
      .createQueryBuilder('payment')
      .select('COALESCE(SUM(payment.amount), 0)', 'total')
      .where('payment.status = :status', { status: 'completed' })
      .getRawOne();

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyRevenueResult = await this.paymentRepo
      .createQueryBuilder('payment')
      .select('COALESCE(SUM(payment.amount), 0)', 'total')
      .where('payment.status = :status AND payment.createdAt >= :start', {
        status: 'completed',
        start: monthStart,
      })
      .getRawOne();

    return {
      totalUsers,
      totalBookings,
      activeBookings,
      todayBookings,
      totalResources,
      totalLocations,
      totalRevenue: parseFloat(revenueResult?.total || '0'),
      monthlyRevenue: parseFloat(monthlyRevenueResult?.total || '0'),
      currency: 'GEL',
    };
  }

  async getRecentBookings(limit = 10) {
    return this.bookingRepo.find({
      relations: ['user', 'resource'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getBookingsByLocation() {
    const result = await this.bookingRepo
      .createQueryBuilder('booking')
      .leftJoin('booking.resource', 'resource')
      .leftJoin('resource.location', 'location')
      .select('location.name', 'locationName')
      .addSelect('COUNT(booking.id)', 'count')
      .groupBy('location.name')
      .getRawMany();

    return result.map((r) => ({
      locationName: r.locationName || 'Unknown',
      count: parseInt(r.count, 10),
    }));
  }
}
