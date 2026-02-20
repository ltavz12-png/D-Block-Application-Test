import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { CreateRateCodeDto } from './dto/create-rate-code.dto';
import { UpdateRateCodeDto } from './dto/update-rate-code.dto';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@/common/database/entities/user.entity';
import { ProductType } from '@/common/database/entities/product.entity';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ─── Public Endpoints ──────────────────────────────────────────────────

  @Public()
  @Get()
  @ApiOperation({ summary: 'List active products (public)' })
  @ApiQuery({ name: 'locationId', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, enum: ProductType })
  async listPublic(
    @Query('locationId') locationId?: string,
    @Query('type') type?: ProductType,
  ) {
    if (locationId) {
      return this.productsService.findActiveByLocation(locationId);
    }

    if (type) {
      return this.productsService.findActiveByType(type);
    }

    return this.productsService.findAll({ isActive: true });
  }

  // ─── Admin Endpoints (static routes before parameterized) ─────────────

  @Get('admin')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all products with pagination and filters (admin)' })
  async listAdmin(@Query() query: QueryProductDto) {
    return this.productsService.findAll(query);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product' })
  async create(
    @Body() dto: CreateProductDto,
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    return this.productsService.create(dto, user.id);
  }

  // ─── Rate Code Endpoints (static 'rates' routes before ':id') ─────────

  @Patch('rates/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a rate code' })
  @ApiParam({ name: 'id', type: String })
  async updateRate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRateCodeDto,
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    return this.productsService.updateRateCode(id, dto, user.id);
  }

  @Delete('rates/:id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a rate code' })
  @ApiParam({ name: 'id', type: String })
  async removeRate(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.removeRateCode(id);
  }

  // ─── Parameterized Product Endpoints ──────────────────────────────────

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get a single product with rate codes (public)' })
  @ApiParam({ name: 'id', type: String })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', type: String })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    return this.productsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a product' })
  @ApiParam({ name: 'id', type: String })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }

  // ─── Nested Rate Code Endpoints (under :productId) ────────────────────

  @Get(':productId/rates')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List rate codes for a product' })
  @ApiParam({ name: 'productId', type: String })
  async listRates(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.productsService.findRateCodesByProduct(productId);
  }

  @Post(':productId/rates')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a rate code for a product' })
  @ApiParam({ name: 'productId', type: String })
  async createRate(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: CreateRateCodeDto,
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    // Ensure productId from the URL is used
    dto.productId = productId;
    return this.productsService.createRateCode(dto, user.id);
  }
}
