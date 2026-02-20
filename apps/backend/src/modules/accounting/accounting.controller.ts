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
import { AccountingService } from './accounting.service';
import { RevenueRecognitionService } from './revenue-recognition.service';
import { CreatePeriodDto } from './dto/create-period.dto';
import { ClosePeriodDto } from './dto/close-period.dto';
import { QueryRevenueDto } from './dto/query-revenue.dto';
import { RevenueAdjustmentDto } from './dto/revenue-adjustment.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@/common/database/entities/user.entity';

@ApiTags('Accounting')
@ApiBearerAuth()
@Controller('accounting')
export class AccountingController {
  constructor(
    private readonly accountingService: AccountingService,
    private readonly revenueRecognitionService: RevenueRecognitionService,
  ) {}

  // ──── Period Routes (static before parameterized) ───────────────────

  @Get('periods')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({ summary: 'List all accounting periods' })
  findAllPeriods(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.accountingService.findAllPeriods(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get('periods/current')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({ summary: 'Get the current open accounting period' })
  findCurrentPeriod() {
    return this.accountingService.findCurrentPeriod();
  }

  @Post('periods')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({ summary: 'Create a new accounting period' })
  createPeriod(
    @Body() dto: CreatePeriodDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.accountingService.createPeriod(dto, user.id);
  }

  @Get('periods/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({ summary: 'Get an accounting period by ID' })
  findPeriodById(@Param('id', ParseUUIDPipe) id: string) {
    return this.accountingService.findPeriodById(id);
  }

  @Get('periods/:id/summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({ summary: 'Get revenue summary for an accounting period' })
  getPeriodSummary(@Param('id', ParseUUIDPipe) id: string) {
    return this.accountingService.getPeriodSummary(id);
  }

  @Post('periods/:id/close')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({ summary: 'Close an accounting period' })
  closePeriod(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ClosePeriodDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.accountingService.closePeriod(id, dto, user.id);
  }

  @Post('periods/:id/reopen')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reopen a closed accounting period' })
  reopenPeriod(@Param('id', ParseUUIDPipe) id: string) {
    return this.accountingService.reopenPeriod(id);
  }

  // ──── Revenue Routes (static before parameterized) ──────────────────

  @Get('revenue')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({ summary: 'Query revenue entries with filters' })
  findRevenueEntries(@Query() query: QueryRevenueDto) {
    return this.accountingService.findRevenueEntries(query);
  }

  @Get('revenue/summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({ summary: 'Get revenue summary for a date range' })
  getRevenueSummary(
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
    @Query('locationId') locationId?: string,
  ) {
    return this.revenueRecognitionService.getRevenueSummary(
      new Date(dateFrom),
      new Date(dateTo),
      locationId,
    );
  }

  @Post('revenue/adjustment')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @ApiOperation({ summary: 'Create a manual revenue adjustment' })
  createAdjustment(@Body() dto: RevenueAdjustmentDto) {
    return this.revenueRecognitionService.createAdjustment(dto);
  }

  @Post('revenue/run-daily')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Trigger daily revenue recognition' })
  runDailyRecognition(@Query('date') date?: string) {
    const recognitionDate = date ? new Date(date) : new Date();
    return this.revenueRecognitionService.runDailyRecognition(recognitionDate);
  }
}
