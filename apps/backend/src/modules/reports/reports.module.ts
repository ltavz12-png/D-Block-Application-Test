import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Booking } from '@/common/database/entities/booking.entity';
import { Payment } from '@/common/database/entities/payment.entity';
import { Resource } from '@/common/database/entities/resource.entity';
import { User } from '@/common/database/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Payment, Resource, User]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
