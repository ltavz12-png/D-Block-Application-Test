import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from '@/common/database/entities/product.entity';
import { RateCode } from '@/common/database/entities/rate-code.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, RateCode]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
