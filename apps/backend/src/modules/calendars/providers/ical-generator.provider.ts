import { Injectable, Logger } from '@nestjs/common';
import { CalendarEvent } from './calendar-provider.interface';

@Injectable()
export class ICalGeneratorProvider {
  private readonly logger = new Logger(ICalGeneratorProvider.name);

  /**
   * Generates a single .ics file content for one calendar event.
   */
  generateICalEvent(event: CalendarEvent): string {
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//D Block Workspace//Bookings//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      this.buildVEvent(event),
      'END:VCALENDAR',
    ];

    return lines.join('\r\n');
  }

  /**
   * Generates an .ics feed with multiple events.
   */
  generateICalFeed(events: CalendarEvent[]): string {
    const vevents = events.map((event) => this.buildVEvent(event)).join('\r\n');

    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//D Block Workspace//Bookings//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:D Block Workspace Bookings',
      vevents,
      'END:VCALENDAR',
    ];

    return lines.join('\r\n');
  }

  private buildVEvent(event: CalendarEvent): string {
    const uid = event.id
      ? `booking-${event.id}@dblock.com`
      : `booking-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@dblock.com`;

    const dtstart = this.formatDateToICal(event.startTime);
    const dtend = this.formatDateToICal(event.endTime);
    const dtstamp = this.formatDateToICal(new Date());
    const created = this.formatDateToICal(new Date());

    const lines: string[] = [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `CREATED:${created}`,
      `SUMMARY:${this.escapeICalText(event.title)}`,
    ];

    if (event.description) {
      lines.push(
        `DESCRIPTION:${this.escapeICalText(event.description)}`,
      );
    }

    if (event.location) {
      lines.push(`LOCATION:${this.escapeICalText(event.location)}`);
    }

    if (event.attendees && event.attendees.length > 0) {
      for (const attendee of event.attendees) {
        lines.push(`ATTENDEE;CN=${attendee}:mailto:${attendee}`);
      }
    }

    if (event.reminders && event.reminders.length > 0) {
      for (const reminder of event.reminders) {
        lines.push('BEGIN:VALARM');
        lines.push(
          `TRIGGER:-PT${reminder.minutes}M`,
        );
        lines.push(
          reminder.method === 'email'
            ? 'ACTION:EMAIL'
            : 'ACTION:DISPLAY',
        );
        lines.push(
          `DESCRIPTION:${this.escapeICalText(event.title)}`,
        );
        lines.push('END:VALARM');
      }
    }

    lines.push('END:VEVENT');

    return lines.join('\r\n');
  }

  /**
   * Formats a Date to iCal UTC format: YYYYMMDDTHHmmssZ
   */
  private formatDateToICal(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');

    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  }

  /**
   * Escapes special characters for iCal text values per RFC 5545.
   * Backslash, semicolons, commas, and newlines must be escaped.
   */
  private escapeICalText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '');
  }
}
