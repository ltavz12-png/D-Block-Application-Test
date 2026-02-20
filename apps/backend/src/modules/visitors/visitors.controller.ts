import {
  Controller,
  Get,
  Post,
  Patch,
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
import { VisitorsService } from './visitors.service';
import { CreateVisitorDto } from './dto/create-visitor.dto';
import { UpdateVisitorDto } from './dto/update-visitor.dto';
import { QueryVisitorsDto } from './dto/query-visitors.dto';

@ApiTags('Visitors')
@ApiBearerAuth()
@Controller('visitors')
export class VisitorsController {
  constructor(private readonly visitorsService: VisitorsService) {}

  // --- Static routes first ---

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.LOCATION_MANAGER, UserRole.RECEPTION_STAFF)
  @ApiOperation({ summary: 'List all visitors with filters and pagination' })
  async findAll(@Query() query: QueryVisitorsDto) {
    return this.visitorsService.findAll(query);
  }

  @Get('my')
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
  @ApiOperation({ summary: 'List visitors invited by the current user' })
  async findMyVisitors(
    @CurrentUser() user: { id: string },
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.visitorsService.findMyVisitors(
      user.id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get('today/:locationId')
  @Roles(UserRole.RECEPTION_STAFF, UserRole.LOCATION_MANAGER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get today\'s expected and checked-in visitors for a location' })
  @ApiParam({ name: 'locationId', description: 'Location UUID' })
  async findTodaysVisitors(
    @Param('locationId', ParseUUIDPipe) locationId: string,
  ) {
    return this.visitorsService.findTodaysVisitors(locationId);
  }

  @Get('stats/:locationId')
  @Roles(UserRole.LOCATION_MANAGER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get visitor statistics for a location' })
  @ApiParam({ name: 'locationId', description: 'Location UUID' })
  async getVisitorStats(
    @Param('locationId', ParseUUIDPipe) locationId: string,
  ) {
    return this.visitorsService.getVisitorStats(locationId);
  }

  @Post()
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
  @ApiOperation({ summary: 'Invite a visitor' })
  async inviteVisitor(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateVisitorDto,
  ) {
    return this.visitorsService.inviteVisitor(user.id, dto);
  }

  // --- Parameterized routes ---

  @Get(':id')
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
  @ApiOperation({ summary: 'Get visitor details by ID' })
  @ApiParam({ name: 'id', description: 'Visitor UUID' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.visitorsService.findById(id);
  }

  @Patch(':id')
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
  @ApiOperation({ summary: 'Update visitor details (host only, EXPECTED status)' })
  @ApiParam({ name: 'id', description: 'Visitor UUID' })
  async updateVisitor(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateVisitorDto,
  ) {
    return this.visitorsService.updateVisitor(id, user.id, dto);
  }

  @Post(':id/cancel')
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
  @ApiOperation({ summary: 'Cancel a visitor invitation (host only)' })
  @ApiParam({ name: 'id', description: 'Visitor UUID' })
  async cancelVisitor(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.visitorsService.cancelVisitor(id, user.id);
  }

  @Post(':id/check-in')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.RECEPTION_STAFF, UserRole.LOCATION_MANAGER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Check in a visitor (reception/manager only)' })
  @ApiParam({ name: 'id', description: 'Visitor UUID' })
  async checkInVisitor(@Param('id', ParseUUIDPipe) id: string) {
    return this.visitorsService.checkInVisitor(id);
  }

  @Post(':id/check-out')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.RECEPTION_STAFF, UserRole.LOCATION_MANAGER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Check out a visitor (reception/manager only)' })
  @ApiParam({ name: 'id', description: 'Visitor UUID' })
  async checkOutVisitor(@Param('id', ParseUUIDPipe) id: string) {
    return this.visitorsService.checkOutVisitor(id);
  }

  @Post(':id/no-show')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.RECEPTION_STAFF, UserRole.LOCATION_MANAGER, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Mark a visitor as no-show (reception/manager only)' })
  @ApiParam({ name: 'id', description: 'Visitor UUID' })
  async markNoShow(@Param('id', ParseUUIDPipe) id: string) {
    return this.visitorsService.markNoShow(id);
  }
}
