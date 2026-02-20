import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountingPeriod } from '@/common/database/entities/accounting-period.entity';
import { RevenueEntry } from '@/common/database/entities/revenue-entry.entity';
import { Booking } from '@/common/database/entities/booking.entity';
import { UserPass } from '@/common/database/entities/user-pass.entity';
import { Contract } from '@/common/database/entities/contract.entity';
import { AccountingController } from './accounting.controller';
import { AccountingService } from './accounting.service';
import { RevenueRecognitionService } from './revenue-recognition.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccountingPeriod, RevenueEntry, Booking, UserPass, Contract]),
  ],
  controllers: [AccountingController],
  providers: [AccountingService, RevenueRecognitionService],
  exports: [AccountingService, RevenueRecognitionService],
})
export class AccountingModule {}
