import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreditsService } from './credits.service';
import { PurchaseCreditPackageDto } from './dto/purchase-credits.dto';
import { DeductCreditsDto } from './dto/deduct-credits.dto';
import { QueryCreditsDto } from './dto/query-credits.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@/common/database/entities/user.entity';

@ApiTags('Credits')
@ApiBearerAuth()
@Controller('credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  // ─── Company Admin / Admin Endpoints ──────────────────────────

  @Roles(
    UserRole.COMPANY_ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE_ADMIN,
  )
  @Get('balance/:companyId')
  @ApiOperation({ summary: 'Get credit balance for a company' })
  async getBalance(
    @Param('companyId', ParseUUIDPipe) companyId: string,
  ) {
    return this.creditsService.getBalance(companyId);
  }

  @Roles(
    UserRole.COMPANY_ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE_ADMIN,
  )
  @Get('packages/:companyId')
  @ApiOperation({ summary: 'List credit packages for a company' })
  async findPackagesByCompany(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Query() query: QueryCreditsDto,
  ) {
    return this.creditsService.findPackagesByCompany(companyId, query);
  }

  @Roles(
    UserRole.COMPANY_ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE_ADMIN,
  )
  @Get('packages/detail/:id')
  @ApiOperation({ summary: 'Get a single credit package with transactions' })
  async findPackageById(@Param('id', ParseUUIDPipe) id: string) {
    return this.creditsService.findPackageById(id);
  }

  @Roles(
    UserRole.COMPANY_ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE_ADMIN,
  )
  @Get('transactions/:companyId')
  @ApiOperation({ summary: 'Get transaction history for a company' })
  async getTransactionHistory(
    @Param('companyId', ParseUUIDPipe) companyId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.creditsService.getTransactionHistory(
      companyId,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  // ─── Admin-Only Endpoints ─────────────────────────────────────

  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @Post('packages')
  @ApiOperation({ summary: 'Purchase a credit package (admin)' })
  async purchasePackage(
    @Body() dto: PurchaseCreditPackageDto,
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    return this.creditsService.purchasePackage(dto, user.id);
  }

  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE_ADMIN,
    UserRole.LOCATION_MANAGER,
  )
  @Post('deduct')
  @ApiOperation({ summary: 'Deduct credits from a company (admin)' })
  async deductCredits(@Body() dto: DeductCreditsDto) {
    return this.creditsService.deductCredits(dto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @Post('refund')
  @ApiOperation({ summary: 'Refund credits to a company (admin)' })
  async refundCredits(
    @Body()
    body: {
      companyId: string;
      userId: string;
      minutes: number;
      bookingId?: string;
      description?: string;
    },
  ) {
    return this.creditsService.refundCredits(
      body.companyId,
      body.userId,
      body.minutes,
      body.bookingId,
      body.description,
    );
  }
}
