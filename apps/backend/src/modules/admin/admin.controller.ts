import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('dashboard/recent-bookings')
  @ApiOperation({ summary: 'Get recent bookings for dashboard' })
  async getRecentBookings(@Query('limit') limit?: number) {
    return this.adminService.getRecentBookings(limit || 10);
  }

  @Get('dashboard/bookings-by-location')
  @ApiOperation({ summary: 'Get bookings grouped by location' })
  async getBookingsByLocation() {
    return this.adminService.getBookingsByLocation();
  }
}
