import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { Invoice } from '@/common/database/entities/invoice.entity';
import { Contract } from '@/common/database/entities/contract.entity';
import { Company } from '@/common/database/entities/company.entity';
import { Booking } from '@/common/database/entities/booking.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, Contract, Company, Booking]),
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
