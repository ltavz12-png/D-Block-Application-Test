import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Res,
  Header,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse as ApiResponseDecorator,
} from '@nestjs/swagger';
import { Response } from 'express';
import { CalendarsService } from './calendars.service';
import { CalendarProvider } from './providers/calendar-provider.interface';
import { ConnectCalendarDto } from './dto/connect-calendar.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/database/entities/user.entity';

@ApiTags('Calendars')
@ApiBearerAuth()
@Controller('calendars')
export class CalendarsController {
  constructor(private readonly calendarsService: CalendarsService) {}

  @Get('connections')
  @Roles(
    UserRole.MEMBER,
    UserRole.COMPANY_EMPLOYEE,
    UserRole.COMPANY_ADMIN,
    UserRole.RECEPTION_STAFF,
    UserRole.LOCATION_MANAGER,
    UserRole.SUPPORT_AGENT,
    UserRole.MARKETING_ADMIN,
    UserRole.FINANCE_ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Get user calendar connections' })
  @ApiResponseDecorator({
    status: 200,
    description: 'List of calendar provider connections and their status',
  })
  async getConnections(@CurrentUser() user: { id: string }) {
    return this.calendarsService.getUserConnections(user.id);
  }

  @Get('auth-url/:provider')
  @Roles(
    UserRole.MEMBER,
    UserRole.COMPANY_EMPLOYEE,
    UserRole.COMPANY_ADMIN,
    UserRole.RECEPTION_STAFF,
    UserRole.LOCATION_MANAGER,
    UserRole.SUPPORT_AGENT,
    UserRole.MARKETING_ADMIN,
    UserRole.FINANCE_ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Get OAuth authorization URL for a calendar provider' })
  @ApiParam({
    name: 'provider',
    enum: [CalendarProvider.GOOGLE, CalendarProvider.OUTLOOK],
    description: 'Calendar provider',
  })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns the OAuth authorization URL',
  })
  getAuthUrl(
    @Param('provider') provider: string,
    @CurrentUser() user: { id: string },
  ) {
    const calendarProvider = this.validateApiProvider(provider);
    const url = this.calendarsService.getAuthUrl(calendarProvider, user.id);
    return { url };
  }

  @Post('connect')
  @Roles(
    UserRole.MEMBER,
    UserRole.COMPANY_EMPLOYEE,
    UserRole.COMPANY_ADMIN,
    UserRole.RECEPTION_STAFF,
    UserRole.LOCATION_MANAGER,
    UserRole.SUPPORT_AGENT,
    UserRole.MARKETING_ADMIN,
    UserRole.FINANCE_ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Connect a calendar provider using OAuth authorization code' })
  @ApiResponseDecorator({
    status: 201,
    description: 'Calendar provider connected successfully',
  })
  async connectCalendar(
    @Body() dto: ConnectCalendarDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.calendarsService.connectCalendar(
      user.id,
      dto.provider,
      dto.code,
    );
  }

  @Post('disconnect/:provider')
  @Roles(
    UserRole.MEMBER,
    UserRole.COMPANY_EMPLOYEE,
    UserRole.COMPANY_ADMIN,
    UserRole.RECEPTION_STAFF,
    UserRole.LOCATION_MANAGER,
    UserRole.SUPPORT_AGENT,
    UserRole.MARKETING_ADMIN,
    UserRole.FINANCE_ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Disconnect a calendar provider' })
  @ApiParam({
    name: 'provider',
    enum: [CalendarProvider.GOOGLE, CalendarProvider.OUTLOOK],
    description: 'Calendar provider to disconnect',
  })
  @ApiResponseDecorator({
    status: 200,
    description: 'Calendar provider disconnected successfully',
  })
  async disconnectCalendar(
    @Param('provider') provider: string,
    @CurrentUser() user: { id: string },
  ) {
    const calendarProvider = this.validateApiProvider(provider);
    await this.calendarsService.disconnectCalendar(user.id, calendarProvider);
    return { provider: calendarProvider, connected: false };
  }

  @Get('ical-feed')
  @Roles(
    UserRole.MEMBER,
    UserRole.COMPANY_EMPLOYEE,
    UserRole.COMPANY_ADMIN,
    UserRole.RECEPTION_STAFF,
    UserRole.LOCATION_MANAGER,
    UserRole.SUPPORT_AGENT,
    UserRole.MARKETING_ADMIN,
    UserRole.FINANCE_ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @Header('Content-Type', 'text/calendar')
  @ApiOperation({
    summary: 'Get iCal feed for all user bookings',
    description:
      'Returns an .ics feed containing all bookings for the authenticated user. Can be used for calendar subscription.',
  })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns iCal (.ics) feed content with all user bookings',
  })
  getICalFeed(
    @CurrentUser() user: { id: string },
    @Res() res: Response,
  ) {
    // In a real implementation, we would look up all bookings for the user from the database.
    // For now, generate an empty feed since we don't have a direct bookings repository dependency.
    const icalContent = this.calendarsService.generateICalFeedForUser([]);

    res.set({
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="dblock-bookings-${user.id}.ics"`,
    });

    res.send(icalContent);
  }

  @Get('ical/:bookingId')
  @Public()
  @Header('Content-Type', 'text/calendar')
  @ApiOperation({
    summary: 'Download iCal file for a booking',
    description: 'Public endpoint that generates a .ics file for a single booking. No authentication required.',
  })
  @ApiParam({
    name: 'bookingId',
    description: 'Booking UUID',
  })
  @ApiResponseDecorator({
    status: 200,
    description: 'Returns iCal (.ics) file content',
  })
  getICalForBooking(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @Res() res: Response,
  ) {
    // In a real implementation, we would look up the booking from the database.
    // For now, generate a placeholder iCal with the booking ID.
    const icalContent = this.calendarsService.generateICalForBooking({
      id: bookingId,
      resourceName: 'D Block Workspace',
      locationName: 'D Block',
      locationAddress: 'Tbilisi, Georgia',
      startTime: new Date(),
      endTime: new Date(Date.now() + 3600 * 1000),
    });

    res.set({
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="booking-${bookingId}.ics"`,
    });

    res.send(icalContent);
  }

  /**
   * Validates that the provider is a valid API-based calendar provider (Google or Outlook).
   * Apple is excluded because it uses iCal generation only.
   */
  private validateApiProvider(provider: string): CalendarProvider {
    if (
      provider !== CalendarProvider.GOOGLE &&
      provider !== CalendarProvider.OUTLOOK
    ) {
      throw new BadRequestException(
        `Invalid calendar provider: ${provider}. Supported API providers are: google, outlook`,
      );
    }
    return provider as CalendarProvider;
  }
}
