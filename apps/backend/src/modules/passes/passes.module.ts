import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserPass } from '@/common/database/entities/user-pass.entity';
import { Product } from '@/common/database/entities/product.entity';
import { RateCode } from '@/common/database/entities/rate-code.entity';
import { PassesController } from './passes.controller';
import { PassesService } from './passes.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserPass, Product, RateCode])],
  controllers: [PassesController],
  providers: [PassesService],
  exports: [PassesService],
})
export class PassesModule {}
