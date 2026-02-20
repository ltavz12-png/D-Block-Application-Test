import { Module } from '@nestjs/common';
import { CalendarsController } from './calendars.controller';
import { CalendarsService } from './calendars.service';
import { GoogleCalendarProvider } from './providers/google-calendar.provider';
import { OutlookCalendarProvider } from './providers/outlook-calendar.provider';
import { ICalGeneratorProvider } from './providers/ical-generator.provider';

@Module({
  imports: [],
  controllers: [CalendarsController],
  providers: [
    CalendarsService,
    GoogleCalendarProvider,
    OutlookCalendarProvider,
    ICalGeneratorProvider,
  ],
  exports: [CalendarsService],
})
export class CalendarsModule {}
