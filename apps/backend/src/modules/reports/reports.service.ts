import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Booking } from '@/common/database/entities/booking.entity';
import { Payment } from '@/common/database/entities/payment.entity';
import { Resource } from '@/common/database/entities/resource.entity';
import { User } from '@/common/database/entities/user.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Booking) private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Resource) private readonly resourceRepo: Repository<Resource>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async getBookingReport(startDate?: string, endDate?: string, locationId?: string) {
    const qb = this.bookingRepo.createQueryBuilder('booking')
      .leftJoinAndSelect('booking.resource', 'resource')
      .leftJoinAndSelect('resource.location', 'location');

    if (startDate && endDate) {
      qb.andWhere('booking.startTime BETWEEN :start AND :end', {
        start: new Date(startDate),
        end: new Date(endDate),
      });
    }
    if (locationId) {
      qb.andWhere('resource.locationId = :locationId', { locationId });
    }

    const bookings = await qb.getMany();

    const totalBookings = bookings.length;
    const confirmedCount = bookings.filter((b) => b.status === 'confirmed').length;
    const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length;
    const totalRevenue = bookings.reduce((sum, b) => sum + Number(b.totalAmount), 0);

    return {
      totalBookings,
      confirmedCount,
      cancelledCount,
      totalRevenue,
      currency: 'GEL',
      bookings: bookings.slice(0, 100),
    };
  }

  async getRevenueReport(startDate?: string, endDate?: string) {
    const qb = this.paymentRepo.createQueryBuilder('payment');

    if (startDate && endDate) {
      qb.andWhere('payment.createdAt BETWEEN :start AND :end', {
        start: new Date(startDate),
        end: new Date(endDate),
      });
    }

    const payments = await qb.getMany();

    const totalRevenue = payments
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const pendingRevenue = payments
      .filter((p) => p.status === 'pending')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const refundedAmount = payments
      .filter((p) => p.status === 'refunded')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      totalRevenue,
      pendingRevenue,
      refundedAmount,
      transactionCount: payments.length,
      currency: 'GEL',
    };
  }

  async getOccupancyReport(locationId?: string) {
    const qb = this.resourceRepo.createQueryBuilder('resource')
      .leftJoinAndSelect('resource.location', 'location');

    if (locationId) {
      qb.andWhere('resource.locationId = :locationId', { locationId });
    }

    const resources = await qb.getMany();
    const totalResources = resources.length;
    const activeResources = resources.filter((r) => r.isActive).length;

    // Count current bookings for occupancy
    const now = new Date();
    const currentBookings = await this.bookingRepo
      .createQueryBuilder('booking')
      .where('booking.startTime <= :now AND booking.endTime >= :now', { now })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: ['confirmed', 'checked_in'],
      })
      .getCount();

    return {
      totalResources,
      activeResources,
      currentlyOccupied: currentBookings,
      occupancyRate: totalResources > 0
        ? Math.round((currentBookings / totalResources) * 100)
        : 0,
    };
  }

  async getUserReport() {
    const totalUsers = await this.userRepo.count();
    const activeUsers = await this.userRepo.count({ where: { status: 'active' as any } });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUsersThisMonth = await this.userRepo
      .createQueryBuilder('user')
      .where('user.createdAt >= :date', { date: thirtyDaysAgo })
      .getCount();

    return {
      totalUsers,
      activeUsers,
      newUsersThisMonth,
    };
  }
}
