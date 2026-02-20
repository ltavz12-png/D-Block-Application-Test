import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking } from '@/common/database/entities/booking.entity';
import { Resource } from '@/common/database/entities/resource.entity';
import { UserPass } from '@/common/database/entities/user-pass.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Resource, UserPass]),
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
