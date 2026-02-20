import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@/common/database/entities/user.entity';
import { AnalyticsService } from './analytics.service';
import { ConsentService } from './consent/consent.service';
import { TrackEventDto } from './dto/track-event.dto';
import { TrackBatchEventsDto } from './dto/track-batch-events.dto';
import { QueryAnalyticsDto } from './dto/query-analytics.dto';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { UpdateConsentDto } from './dto/update-consent.dto';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly consentService: ConsentService,
  ) {}

  // ──────────────────────────────────────────────
  // Tracking endpoints
  // ──────────────────────────────────────────────

  @Post('track')
  @HttpCode(HttpStatus.CREATED)
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
  @ApiOperation({ summary: 'Track a single analytics event' })
  async trackEvent(
    @CurrentUser() user: { id: string },
    @Body() dto: TrackEventDto,
    @Req() req: any,
  ) {
    return this.analyticsService.trackEvent(user.id, dto, req);
  }

  @Post('track/batch')
  @HttpCode(HttpStatus.CREATED)
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
  @ApiOperation({ summary: 'Track a batch of analytics events (max 100)' })
  async trackBatchEvents(
    @CurrentUser() user: { id: string },
    @Body() dto: TrackBatchEventsDto,
    @Req() req: any,
  ) {
    return this.analyticsService.trackBatchEvents(user.id, dto, req);
  }

  // ──────────────────────────────────────────────
  // Admin: event listing
  // ──────────────────────────────────────────────

  @Get('events')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING_ADMIN)
  @ApiOperation({ summary: 'List analytics events with filters and pagination (admin)' })
  async findAll(@Query() query: QueryAnalyticsDto) {
    return this.analyticsService.findAll(query);
  }

  // ──────────────────────────────────────────────
  // Admin: dashboard endpoints
  // ──────────────────────────────────────────────

  @Get('dashboard/event-counts')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING_ADMIN)
  @ApiOperation({ summary: 'Get event counts grouped by name and time period (admin)' })
  async getEventCounts(@Query() query: DashboardQueryDto) {
    return this.analyticsService.getEventCounts(
      query.dateFrom,
      query.dateTo,
      query.locationId,
      query.granularity,
    );
  }

  @Get('dashboard/active-users')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING_ADMIN)
  @ApiOperation({ summary: 'Get active user counts by time period (admin)' })
  async getActiveUsers(@Query() query: DashboardQueryDto) {
    return this.analyticsService.getActiveUsers(
      query.dateFrom,
      query.dateTo,
      query.granularity,
    );
  }

  @Get('dashboard/funnel')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING_ADMIN)
  @ApiOperation({ summary: 'Get user conversion funnel: signup -> booking -> payment -> repeat (admin)' })
  async getUserFunnel(@Query() query: DashboardQueryDto) {
    return this.analyticsService.getUserFunnel(
      query.dateFrom,
      query.dateTo,
      query.locationId,
    );
  }

  @Get('dashboard/top-events')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING_ADMIN)
  @ApiOperation({ summary: 'Get most frequent events (admin)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max results (default 20)' })
  async getTopEvents(
    @Query() query: DashboardQueryDto,
    @Query('limit') limit?: number,
  ) {
    return this.analyticsService.getTopEvents(
      query.dateFrom,
      query.dateTo,
      limit ? Number(limit) : undefined,
    );
  }

  @Get('dashboard/platforms')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING_ADMIN)
  @ApiOperation({ summary: 'Get event breakdown by platform (admin)' })
  async getPlatformBreakdown(@Query() query: DashboardQueryDto) {
    return this.analyticsService.getPlatformBreakdown(
      query.dateFrom,
      query.dateTo,
    );
  }

  @Get('dashboard/locations')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING_ADMIN)
  @ApiOperation({ summary: 'Get event breakdown by location (admin)' })
  async getLocationBreakdown(@Query() query: DashboardQueryDto) {
    return this.analyticsService.getLocationBreakdown(
      query.dateFrom,
      query.dateTo,
    );
  }

  // ──────────────────────────────────────────────
  // Member: consent management
  // ──────────────────────────────────────────────

  @Get('consent')
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
  @ApiOperation({ summary: 'Get current user consent preferences' })
  async getConsent(@CurrentUser() user: { id: string }) {
    return this.consentService.getUserConsent(user.id);
  }

  @Patch('consent')
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
  @ApiOperation({ summary: 'Update current user consent preferences' })
  async updateConsent(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateConsentDto,
  ) {
    return this.consentService.updateUserConsent(user.id, dto);
  }

  // ──────────────────────────────────────────────
  // Member: GDPR data export / deletion
  // ──────────────────────────────────────────────

  @Get('my/export')
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
  @ApiOperation({ summary: 'Export all analytics data for the current user (GDPR)' })
  async exportMyData(@CurrentUser() user: { id: string }) {
    return this.analyticsService.exportUserAnalytics(user.id);
  }

  @Delete('my/data')
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
  @ApiOperation({ summary: 'Delete all analytics data for the current user (GDPR)' })
  async deleteMyData(@CurrentUser() user: { id: string }) {
    return this.analyticsService.deleteUserAnalytics(user.id);
  }
}
