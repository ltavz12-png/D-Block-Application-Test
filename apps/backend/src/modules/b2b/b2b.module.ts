import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from '@/common/database/entities/company.entity';
import { User } from '@/common/database/entities/user.entity';
import { Contract } from '@/common/database/entities/contract.entity';
import { B2bController } from './b2b.controller';
import { B2bService } from './b2b.service';

@Module({
  imports: [TypeOrmModule.forFeature([Company, User, Contract])],
  controllers: [B2bController],
  providers: [B2bService],
  exports: [B2bService],
})
export class B2bModule {}
