import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { QueryBookingDto } from './dto/query-booking.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@/common/database/entities/user.entity';

const ADMIN_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.LOCATION_MANAGER,
  UserRole.RECEPTION_STAFF,
];

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // ──── Member Endpoints ──────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Create a new booking' })
  create(
    @Body() dto: CreateBookingDto,
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    return this.bookingsService.createBooking(user.id, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my bookings with filters' })
  findMyBookings(
    @Query() query: QueryBookingDto,
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    return this.bookingsService.findByUser(user.id, query);
  }

  @Get('my/upcoming')
  @ApiOperation({ summary: 'Get my upcoming bookings' })
  findMyUpcoming(
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    return this.bookingsService.findUpcoming(user.id);
  }

  // ──── Admin Endpoints (must be before :id routes) ───────────────

  @Get('admin')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Admin: list all bookings with filters' })
  findAllAdmin(@Query() query: QueryBookingDto) {
    return this.bookingsService.findAll(query);
  }

  @Get('admin/stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.LOCATION_MANAGER)
  @ApiOperation({ summary: 'Admin: get booking statistics' })
  @ApiQuery({ name: 'locationId', required: false, description: 'Filter by location' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'From date (ISO 8601)' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'To date (ISO 8601)' })
  getStats(
    @Query('locationId') locationId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.bookingsService.getBookingStats({
      locationId,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    });
  }

  // ──── Parameterized Member Endpoints ────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Get a single booking by ID' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    const booking = await this.bookingsService.findById(id);
    this.assertOwnerOrAdmin(booking.userId, user);
    return booking;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update booking notes/metadata' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBookingDto,
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    const booking = await this.bookingsService.findById(id);
    this.assertOwnerOrAdmin(booking.userId, user);
    return this.bookingsService.updateBooking(id, dto);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a booking' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelBookingDto,
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    const booking = await this.bookingsService.findById(id);
    this.assertOwnerOrAdmin(booking.userId, user);
    return this.bookingsService.cancelBooking(id, user.id, dto);
  }

  // ──── Admin Parameterized Endpoints ─────────────────────────────

  @Post(':id/confirm')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Admin: confirm a booking' })
  @ApiQuery({ name: 'paymentId', required: false, description: 'Payment ID if payment was made' })
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('paymentId') paymentId?: string,
  ) {
    return this.bookingsService.confirmBooking(id, paymentId);
  }

  @Post(':id/check-in')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Admin: check in a booking' })
  checkIn(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookingsService.checkIn(id);
  }

  @Post(':id/check-out')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Admin: check out a booking' })
  checkOut(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookingsService.checkOut(id);
  }

  @Post(':id/no-show')
  @Roles(UserRole.SUPER_ADMIN, UserRole.LOCATION_MANAGER)
  @ApiOperation({ summary: 'Admin: mark booking as no-show' })
  markNoShow(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookingsService.markNoShow(id);
  }

  // ──── Helpers ───────────────────────────────────────────────────

  private assertOwnerOrAdmin(
    bookingUserId: string,
    user: { id: string; role: string },
  ): void {
    const adminRoles: string[] = [
      UserRole.SUPER_ADMIN,
      UserRole.LOCATION_MANAGER,
      UserRole.RECEPTION_STAFF,
    ];

    if (bookingUserId !== user.id && !adminRoles.includes(user.role)) {
      throw new ForbiddenException('You do not have access to this booking');
    }
  }
}
