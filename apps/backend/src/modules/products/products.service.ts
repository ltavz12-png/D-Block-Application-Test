import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product, ProductType } from '@/common/database/entities/product.entity';
import { RateCode } from '@/common/database/entities/rate-code.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { CreateRateCodeDto } from './dto/create-rate-code.dto';
import { UpdateRateCodeDto } from './dto/update-rate-code.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(RateCode)
    private readonly rateCodeRepo: Repository<RateCode>,
  ) {}

  // ─── Products ──────────────────────────────────────────────────────────

  async findAll(query: QueryProductDto): Promise<{
    data: Product[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      productType,
      locationId,
      isActive,
      billingPeriod,
      page = 1,
      limit = 20,
      search,
    } = query;

    const qb = this.productRepo.createQueryBuilder('product');

    qb.leftJoinAndSelect('product.rateCodes', 'rateCode', 'rateCode.deleted_at IS NULL');

    if (productType) {
      qb.andWhere('product.productType = :productType', { productType });
    }

    if (locationId) {
      qb.andWhere('product.locationId = :locationId', { locationId });
    }

    if (isActive !== undefined) {
      qb.andWhere('product.isActive = :isActive', { isActive });
    }

    if (billingPeriod) {
      qb.andWhere('product.billingPeriod = :billingPeriod', { billingPeriod });
    }

    if (search) {
      qb.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search OR product.nameKa ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.orderBy('product.sortOrder', 'ASC');
    qb.addOrderBy('product.createdAt', 'DESC');
    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, limit };
  }

  async findById(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: ['rateCodes', 'location'],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    return product;
  }

  async findActiveByLocation(locationId: string): Promise<Product[]> {
    return this.productRepo.find({
      where: { locationId, isActive: true },
      relations: ['rateCodes'],
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async findActiveByType(type: ProductType): Promise<Product[]> {
    return this.productRepo.find({
      where: { productType: type, isActive: true },
      relations: ['rateCodes'],
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  async create(dto: CreateProductDto, userId: string): Promise<Product> {
    const product = this.productRepo.create({
      ...dto,
      createdBy: userId,
    });

    return this.productRepo.save(product);
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    userId: string,
  ): Promise<Product> {
    const product = await this.findById(id);

    Object.assign(product, dto, { updatedBy: userId });

    return this.productRepo.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findById(id);
    await this.productRepo.softRemove(product);
  }

  // ─── Rate Codes ────────────────────────────────────────────────────────

  async findRateCodesByProduct(productId: string): Promise<RateCode[]> {
    return this.rateCodeRepo.find({
      where: { productId, isActive: true },
      order: { amount: 'ASC' },
    });
  }

  async findRateCodeById(id: string): Promise<RateCode> {
    const rateCode = await this.rateCodeRepo.findOne({
      where: { id },
      relations: ['product'],
    });

    if (!rateCode) {
      throw new NotFoundException(`Rate code with ID "${id}" not found`);
    }

    return rateCode;
  }

  async createRateCode(dto: CreateRateCodeDto, userId: string): Promise<RateCode> {
    // Verify product exists
    await this.findById(dto.productId);

    const rateCode = this.rateCodeRepo.create({
      ...dto,
      createdBy: userId,
    });

    return this.rateCodeRepo.save(rateCode);
  }

  async updateRateCode(
    id: string,
    dto: UpdateRateCodeDto,
    userId: string,
  ): Promise<RateCode> {
    const rateCode = await this.findRateCodeById(id);

    Object.assign(rateCode, dto, { updatedBy: userId });

    return this.rateCodeRepo.save(rateCode);
  }

  async removeRateCode(id: string): Promise<void> {
    const rateCode = await this.findRateCodeById(id);
    await this.rateCodeRepo.softRemove(rateCode);
  }

  async findBestRate(productId: string, locationId?: string): Promise<RateCode | null> {
    const qb = this.rateCodeRepo.createQueryBuilder('rate');

    qb.where('rate.productId = :productId', { productId });
    qb.andWhere('rate.isActive = :isActive', { isActive: true });

    if (locationId) {
      qb.andWhere(
        '(rate.conditions IS NULL OR rate.conditions->>\'locationIds\' IS NULL OR rate.conditions::jsonb->\'locationIds\' @> :locationId::jsonb)',
        { locationId: JSON.stringify([locationId]) },
      );
    }

    qb.orderBy('rate.amount', 'ASC');
    qb.limit(1);

    return qb.getOne();
  }
}
