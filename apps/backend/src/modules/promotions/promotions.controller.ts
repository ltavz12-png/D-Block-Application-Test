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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@/common/database/entities/user.entity';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { GeneratePromoCodesDto } from './dto/generate-promo-codes.dto';
import { ValidatePromoCodeDto } from './dto/validate-promo-code.dto';
import { QueryPromotionsDto } from './dto/query-promotions.dto';

@ApiTags('Promotions')
@ApiBearerAuth()
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  // --- Static routes first ---

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING_ADMIN)
  @ApiOperation({ summary: 'List promotions with filters and pagination' })
  async findAll(@Query() query: QueryPromotionsDto) {
    return this.promotionsService.findAll(query);
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING_ADMIN)
  @ApiOperation({ summary: 'Get overall promotion statistics' })
  async getOverallStats() {
    return this.promotionsService.getOverallStats();
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING_ADMIN)
  @ApiOperation({ summary: 'Create a new promotion' })
  async createPromotion(
    @CurrentUser() user: { id: string },
    @Body() dto: CreatePromotionDto,
  ) {
    return this.promotionsService.createPromotion(user.id, dto);
  }

  @Post('validate-code')
  @HttpCode(HttpStatus.OK)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE_ADMIN,
    UserRole.LOCATION_MANAGER,
    UserRole.RECEPTION_STAFF,
    UserRole.MARKETING_ADMIN,
    UserRole.SUPPORT_AGENT,
    UserRole.COMPANY_ADMIN,
    UserRole.COMPANY_EMPLOYEE,
    UserRole.MEMBER,
  )
  @ApiOperation({ summary: 'Validate a promo code and calculate discount' })
  async validatePromoCode(@Body() dto: ValidatePromoCodeDto) {
    return this.promotionsService.validatePromoCode(dto);
  }

  @Post('codes/:codeId/deactivate')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING_ADMIN)
  @ApiOperation({ summary: 'Deactivate a promo code' })
  @ApiParam({ name: 'codeId', description: 'Promo code UUID' })
  async deactivatePromoCode(
    @Param('codeId', ParseUUIDPipe) codeId: string,
  ) {
    return this.promotionsService.deactivatePromoCode(codeId);
  }

  // --- Parameterized routes ---

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING_ADMIN)
  @ApiOperation({ summary: 'Get a single promotion by ID' })
  @ApiParam({ name: 'id', description: 'Promotion UUID' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.promotionsService.findById(id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING_ADMIN)
  @ApiOperation({ summary: 'Update a promotion' })
  @ApiParam({ name: 'id', description: 'Promotion UUID' })
  async updatePromotion(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdatePromotionDto,
  ) {
    return this.promotionsService.updatePromotion(id, user.id, dto);
  }

  @Post(':id/toggle-active')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING_ADMIN)
  @ApiOperation({ summary: 'Toggle the active status of a promotion' })
  @ApiParam({ name: 'id', description: 'Promotion UUID' })
  async toggleActive(@Param('id', ParseUUIDPipe) id: string) {
    return this.promotionsService.toggleActive(id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Soft delete a promotion' })
  @ApiParam({ name: 'id', description: 'Promotion UUID' })
  async deletePromotion(@Param('id', ParseUUIDPipe) id: string) {
    return this.promotionsService.deletePromotion(id);
  }

  @Get(':id/stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING_ADMIN)
  @ApiOperation({ summary: 'Get statistics for a specific promotion' })
  @ApiParam({ name: 'id', description: 'Promotion UUID' })
  async getPromotionStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.promotionsService.getPromotionStats(id);
  }

  @Get(':id/codes')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING_ADMIN)
  @ApiOperation({ summary: 'List promo codes for a promotion' })
  @ApiParam({ name: 'id', description: 'Promotion UUID' })
  async findPromoCodesByPromotion(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.promotionsService.findPromoCodesByPromotion(id);
  }

  @Post(':id/codes')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING_ADMIN)
  @ApiOperation({ summary: 'Create a single promo code for a promotion' })
  @ApiParam({ name: 'id', description: 'Promotion UUID' })
  async createPromoCode(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePromoCodeDto,
  ) {
    dto.promotionId = id;
    return this.promotionsService.createPromoCode(dto);
  }

  @Post(':id/codes/generate')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING_ADMIN)
  @ApiOperation({ summary: 'Bulk generate promo codes for a promotion' })
  @ApiParam({ name: 'id', description: 'Promotion UUID' })
  async generatePromoCodes(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: GeneratePromoCodesDto,
  ) {
    dto.promotionId = id;
    return this.promotionsService.generatePromoCodes(dto);
  }
}
