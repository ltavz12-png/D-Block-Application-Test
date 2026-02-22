import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('bookings')
  @ApiOperation({ summary: 'Get booking report' })
  async getBookingReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('locationId') locationId?: string,
  ) {
    return this.reportsService.getBookingReport(startDate, endDate, locationId);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue report' })
  async getRevenueReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getRevenueReport(startDate, endDate);
  }

  @Get('occupancy')
  @ApiOperation({ summary: 'Get occupancy report' })
  async getOccupancyReport(@Query('locationId') locationId?: string) {
    return this.reportsService.getOccupancyReport(locationId);
  }

  @Get('users')
  @ApiOperation({ summary: 'Get user report' })
  async getUserReport() {
    return this.reportsService.getUserReport();
  }
}
