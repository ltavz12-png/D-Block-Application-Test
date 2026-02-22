import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '@/common/database/entities/user.entity';
import { Booking } from '@/common/database/entities/booking.entity';
import { Payment } from '@/common/database/entities/payment.entity';
import { Resource } from '@/common/database/entities/resource.entity';
import { Location } from '@/common/database/entities/location.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Booking, Payment, Resource, Location]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
