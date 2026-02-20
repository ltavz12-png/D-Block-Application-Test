import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  CalendarProvider,
  CalendarTokens,
  CalendarEvent,
  ICalendarProvider,
} from './providers/calendar-provider.interface';
import { GoogleCalendarProvider } from './providers/google-calendar.provider';
import { OutlookCalendarProvider } from './providers/outlook-calendar.provider';
import { ICalGeneratorProvider } from './providers/ical-generator.provider';

interface UserCalendarConnection {
  provider: CalendarProvider;
  tokens: CalendarTokens;
}

interface BookingData {
  id: string;
  resourceName: string;
  locationName: string;
  locationAddress: string;
  startTime: Date;
  endTime: Date;
  notes?: string;
}

@Injectable()
export class CalendarsService {
  private readonly logger = new Logger(CalendarsService.name);

  /**
   * In-memory storage for calendar connections per user.
   * Key format: `${userId}:${provider}`
   * In production, this would be replaced by a CalendarConnection entity in the database.
   */
  private readonly connections = new Map<string, UserCalendarConnection>();

  constructor(
    private readonly googleProvider: GoogleCalendarProvider,
    private readonly outlookProvider: OutlookCalendarProvider,
    private readonly icalGenerator: ICalGeneratorProvider,
  ) {}

  /**
   * Gets the OAuth authorization URL for the specified provider.
   */
  getAuthUrl(provider: CalendarProvider, userId: string): string {
    const calendarProvider = this.getProvider(provider);
    return calendarProvider.getAuthUrl(userId);
  }

  /**
   * Exchanges an OAuth authorization code for tokens and stores the connection.
   */
  async connectCalendar(
    userId: string,
    provider: CalendarProvider,
    code: string,
  ): Promise<{ provider: CalendarProvider; connected: boolean }> {
    const calendarProvider = this.getProvider(provider);

    try {
      const tokens = await calendarProvider.exchangeCodeForTokens(code);

      const connectionKey = this.buildConnectionKey(userId, provider);
      this.connections.set(connectionKey, { provider, tokens });

      this.logger.log(
        `User ${userId} connected ${provider} calendar successfully`,
      );

      return { provider, connected: true };
    } catch (error) {
      this.logger.error(
        `Failed to connect ${provider} calendar for user ${userId}: ${error.message}`,
      );
      throw new BadRequestException(
        `Failed to connect ${provider} calendar: ${error.message}`,
      );
    }
  }

  /**
   * Removes stored tokens and disconnects the calendar provider for a user.
   */
  async disconnectCalendar(
    userId: string,
    provider: CalendarProvider,
  ): Promise<void> {
    const connectionKey = this.buildConnectionKey(userId, provider);
    const existed = this.connections.delete(connectionKey);

    if (existed) {
      this.logger.log(
        `User ${userId} disconnected ${provider} calendar`,
      );
    } else {
      this.logger.warn(
        `User ${userId} attempted to disconnect ${provider} calendar but no connection found`,
      );
    }
  }

  /**
   * Lists all calendar provider connections for a user.
   */
  async getUserConnections(
    userId: string,
  ): Promise<{ provider: CalendarProvider; connected: boolean }[]> {
    const apiProviders = [CalendarProvider.GOOGLE, CalendarProvider.OUTLOOK];

    return apiProviders.map((provider) => {
      const connectionKey = this.buildConnectionKey(userId, provider);
      const connected = this.connections.has(connectionKey);
      return { provider, connected };
    });
  }

  /**
   * Creates a calendar event on all connected API-based calendars for the user.
   * Returns the first event ID created, or null if no calendars are connected.
   */
  async createBookingEvent(
    userId: string,
    booking: BookingData,
  ): Promise<string | null> {
    const event = this.buildCalendarEventFromBooking(booking);
    const userConnections = this.getUserConnectionsList(userId);

    if (userConnections.length === 0) {
      this.logger.log(
        `No connected calendars for user ${userId}. Skipping event creation.`,
      );
      return null;
    }

    let firstEventId: string | null = null;

    for (const connection of userConnections) {
      try {
        const provider = this.getProvider(connection.provider);
        const eventId = await provider.createEvent(connection.tokens, event);

        if (!firstEventId) {
          firstEventId = eventId;
        }

        this.logger.log(
          `Created ${connection.provider} calendar event ${eventId} for booking ${booking.id}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to create ${connection.provider} calendar event for booking ${booking.id}: ${error.message}`,
        );
      }
    }

    return firstEventId;
  }

  /**
   * Updates an existing calendar event on all connected API-based calendars for the user.
   */
  async updateBookingEvent(
    userId: string,
    eventId: string,
    booking: Omit<BookingData, 'id'>,
  ): Promise<void> {
    const event = this.buildCalendarEventFromBooking({
      ...booking,
      id: eventId,
    });
    const userConnections = this.getUserConnectionsList(userId);

    for (const connection of userConnections) {
      try {
        const provider = this.getProvider(connection.provider);
        await provider.updateEvent(connection.tokens, eventId, event);

        this.logger.log(
          `Updated ${connection.provider} calendar event ${eventId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to update ${connection.provider} calendar event ${eventId}: ${error.message}`,
        );
      }
    }
  }

  /**
   * Deletes a calendar event from all connected API-based calendars for the user.
   */
  async deleteBookingEvent(
    userId: string,
    eventId: string,
  ): Promise<void> {
    const userConnections = this.getUserConnectionsList(userId);

    for (const connection of userConnections) {
      try {
        const provider = this.getProvider(connection.provider);
        await provider.deleteEvent(connection.tokens, eventId);

        this.logger.log(
          `Deleted ${connection.provider} calendar event ${eventId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to delete ${connection.provider} calendar event ${eventId}: ${error.message}`,
        );
      }
    }
  }

  /**
   * Generates .ics file content for a single booking (Apple Calendar / iCal download).
   */
  generateICalForBooking(booking: BookingData): string {
    const event = this.buildCalendarEventFromBooking(booking);
    return this.icalGenerator.generateICalEvent(event);
  }

  /**
   * Generates .ics feed content for all user bookings (Apple Calendar / iCal subscription).
   */
  generateICalFeedForUser(bookings: BookingData[]): string {
    const events = bookings.map((booking) =>
      this.buildCalendarEventFromBooking(booking),
    );
    return this.icalGenerator.generateICalFeed(events);
  }

  /**
   * Returns the provider implementation for the given CalendarProvider enum value.
   */
  private getProvider(provider: CalendarProvider): ICalendarProvider {
    switch (provider) {
      case CalendarProvider.GOOGLE:
        return this.googleProvider;
      case CalendarProvider.OUTLOOK:
        return this.outlookProvider;
      case CalendarProvider.APPLE:
        throw new BadRequestException(
          'Apple Calendar does not support API-based operations. Use iCal endpoints instead.',
        );
      default:
        throw new BadRequestException(`Unsupported calendar provider: ${provider}`);
    }
  }

  /**
   * Gets all active connections for a user (API-based providers only).
   */
  private getUserConnectionsList(userId: string): UserCalendarConnection[] {
    const result: UserCalendarConnection[] = [];

    for (const [key, connection] of this.connections.entries()) {
      if (key.startsWith(`${userId}:`)) {
        result.push(connection);
      }
    }

    return result;
  }

  /**
   * Builds a CalendarEvent from booking data.
   */
  private buildCalendarEventFromBooking(booking: BookingData): CalendarEvent {
    const title = `Room Booking - ${booking.resourceName}`;
    const location = booking.locationAddress
      ? `${booking.locationName}, ${booking.locationAddress}`
      : booking.locationName;

    const descriptionParts = [
      `Booking at D Block Workspace`,
      `Resource: ${booking.resourceName}`,
      `Location: ${location}`,
    ];

    if (booking.notes) {
      descriptionParts.push(`Notes: ${booking.notes}`);
    }

    return {
      id: booking.id,
      title,
      description: descriptionParts.join('\n'),
      location,
      startTime: booking.startTime instanceof Date ? booking.startTime : new Date(booking.startTime),
      endTime: booking.endTime instanceof Date ? booking.endTime : new Date(booking.endTime),
      timeZone: 'Asia/Tbilisi',
      reminders: [
        { method: 'popup', minutes: 15 },
        { method: 'email', minutes: 60 },
      ],
    };
  }

  /**
   * Builds the connection key for the in-memory map.
   */
  private buildConnectionKey(
    userId: string,
    provider: CalendarProvider,
  ): string {
    return `${userId}:${provider}`;
  }
}
