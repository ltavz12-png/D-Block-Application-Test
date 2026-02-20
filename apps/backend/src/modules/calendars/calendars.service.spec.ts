import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CalendarsService } from './calendars.service';
import {
  CalendarProvider,
  CalendarTokens,
} from './providers/calendar-provider.interface';
import { GoogleCalendarProvider } from './providers/google-calendar.provider';
import { OutlookCalendarProvider } from './providers/outlook-calendar.provider';
import { ICalGeneratorProvider } from './providers/ical-generator.provider';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockUserId = 'user-0001-0001-0001-000000000001';

const mockTokens: CalendarTokens = {
  accessToken: 'access-token-123',
  refreshToken: 'refresh-token-456',
  expiresAt: new Date('2025-12-31'),
};

const mockBooking = {
  id: 'booking-001',
  resourceName: 'Meeting Room A',
  locationName: 'D Block Stamba',
  locationAddress: '14 Merab Kostava St, Tbilisi',
  startTime: new Date('2025-06-15T10:00:00Z'),
  endTime: new Date('2025-06-15T12:00:00Z'),
  notes: 'Weekly team standup',
};

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('CalendarsService', () => {
  let service: CalendarsService;
  let googleProvider: Record<string, jest.Mock>;
  let outlookProvider: Record<string, jest.Mock>;
  let icalGenerator: Record<string, jest.Mock>;

  beforeEach(async () => {
    googleProvider = {
      getAuthUrl: jest.fn().mockReturnValue('https://accounts.google.com/auth?state=user-001'),
      exchangeCodeForTokens: jest.fn().mockResolvedValue(mockTokens),
      refreshAccessToken: jest.fn().mockResolvedValue(mockTokens),
      createEvent: jest.fn().mockResolvedValue('google-event-001'),
      updateEvent: jest.fn().mockResolvedValue(undefined),
      deleteEvent: jest.fn().mockResolvedValue(undefined),
      listEvents: jest.fn().mockResolvedValue([]),
    };

    outlookProvider = {
      getAuthUrl: jest.fn().mockReturnValue('https://login.microsoftonline.com/auth?state=user-001'),
      exchangeCodeForTokens: jest.fn().mockResolvedValue(mockTokens),
      refreshAccessToken: jest.fn().mockResolvedValue(mockTokens),
      createEvent: jest.fn().mockResolvedValue('outlook-event-001'),
      updateEvent: jest.fn().mockResolvedValue(undefined),
      deleteEvent: jest.fn().mockResolvedValue(undefined),
      listEvents: jest.fn().mockResolvedValue([]),
    };

    icalGenerator = {
      generateICalEvent: jest.fn().mockReturnValue('BEGIN:VCALENDAR...END:VCALENDAR'),
      generateICalFeed: jest.fn().mockReturnValue('BEGIN:VCALENDAR...END:VCALENDAR'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarsService,
        { provide: GoogleCalendarProvider, useValue: googleProvider },
        { provide: OutlookCalendarProvider, useValue: outlookProvider },
        { provide: ICalGeneratorProvider, useValue: icalGenerator },
      ],
    }).compile();

    service = module.get<CalendarsService>(CalendarsService);
  });

  // =========================================================================
  // getAuthUrl
  // =========================================================================

  describe('getAuthUrl', () => {
    it('should return Google auth URL', () => {
      const url = service.getAuthUrl(CalendarProvider.GOOGLE, mockUserId);

      expect(url).toContain('accounts.google.com');
      expect(googleProvider.getAuthUrl).toHaveBeenCalledWith(mockUserId);
    });

    it('should return Outlook auth URL', () => {
      const url = service.getAuthUrl(CalendarProvider.OUTLOOK, mockUserId);

      expect(url).toContain('microsoftonline.com');
      expect(outlookProvider.getAuthUrl).toHaveBeenCalledWith(mockUserId);
    });

    it('should throw BadRequestException for Apple provider', () => {
      expect(() =>
        service.getAuthUrl(CalendarProvider.APPLE, mockUserId),
      ).toThrow(BadRequestException);
    });
  });

  // =========================================================================
  // connectCalendar
  // =========================================================================

  describe('connectCalendar', () => {
    it('should connect Google Calendar and store tokens', async () => {
      const result = await service.connectCalendar(
        mockUserId,
        CalendarProvider.GOOGLE,
        'auth-code-123',
      );

      expect(result).toEqual({
        provider: CalendarProvider.GOOGLE,
        connected: true,
      });
      expect(googleProvider.exchangeCodeForTokens).toHaveBeenCalledWith('auth-code-123');
    });

    it('should connect Outlook Calendar', async () => {
      const result = await service.connectCalendar(
        mockUserId,
        CalendarProvider.OUTLOOK,
        'auth-code-456',
      );

      expect(result).toEqual({
        provider: CalendarProvider.OUTLOOK,
        connected: true,
      });
    });

    it('should throw BadRequestException when token exchange fails', async () => {
      googleProvider.exchangeCodeForTokens.mockRejectedValueOnce(
        new Error('Invalid code'),
      );

      await expect(
        service.connectCalendar(mockUserId, CalendarProvider.GOOGLE, 'bad-code'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // =========================================================================
  // disconnectCalendar
  // =========================================================================

  describe('disconnectCalendar', () => {
    it('should remove stored connection', async () => {
      // First connect
      await service.connectCalendar(
        mockUserId,
        CalendarProvider.GOOGLE,
        'auth-code',
      );

      // Then disconnect
      await service.disconnectCalendar(mockUserId, CalendarProvider.GOOGLE);

      // Check connections
      const connections = await service.getUserConnections(mockUserId);
      const googleConn = connections.find(
        (c) => c.provider === CalendarProvider.GOOGLE,
      );
      expect(googleConn?.connected).toBe(false);
    });

    it('should not throw when disconnecting a non-existent connection', async () => {
      await expect(
        service.disconnectCalendar(mockUserId, CalendarProvider.GOOGLE),
      ).resolves.toBeUndefined();
    });
  });

  // =========================================================================
  // getUserConnections
  // =========================================================================

  describe('getUserConnections', () => {
    it('should return all API providers with connection status', async () => {
      const connections = await service.getUserConnections(mockUserId);

      expect(connections).toHaveLength(2); // Google and Outlook
      expect(connections).toEqual(
        expect.arrayContaining([
          { provider: CalendarProvider.GOOGLE, connected: false },
          { provider: CalendarProvider.OUTLOOK, connected: false },
        ]),
      );
    });

    it('should show connected=true after connecting', async () => {
      await service.connectCalendar(
        mockUserId,
        CalendarProvider.GOOGLE,
        'auth-code',
      );

      const connections = await service.getUserConnections(mockUserId);
      const googleConn = connections.find(
        (c) => c.provider === CalendarProvider.GOOGLE,
      );

      expect(googleConn?.connected).toBe(true);
    });
  });

  // =========================================================================
  // createBookingEvent
  // =========================================================================

  describe('createBookingEvent', () => {
    it('should return null when no calendars are connected', async () => {
      const result = await service.createBookingEvent(mockUserId, mockBooking);

      expect(result).toBeNull();
    });

    it('should create event on connected Google Calendar', async () => {
      // Connect Google first
      await service.connectCalendar(
        mockUserId,
        CalendarProvider.GOOGLE,
        'auth-code',
      );

      const result = await service.createBookingEvent(mockUserId, mockBooking);

      expect(result).toBe('google-event-001');
      expect(googleProvider.createEvent).toHaveBeenCalledWith(
        mockTokens,
        expect.objectContaining({
          title: 'Room Booking - Meeting Room A',
          location: 'D Block Stamba, 14 Merab Kostava St, Tbilisi',
          timeZone: 'Asia/Tbilisi',
        }),
      );
    });

    it('should create events on all connected calendars', async () => {
      await service.connectCalendar(
        mockUserId,
        CalendarProvider.GOOGLE,
        'auth-code-g',
      );
      await service.connectCalendar(
        mockUserId,
        CalendarProvider.OUTLOOK,
        'auth-code-o',
      );

      await service.createBookingEvent(mockUserId, mockBooking);

      expect(googleProvider.createEvent).toHaveBeenCalled();
      expect(outlookProvider.createEvent).toHaveBeenCalled();
    });

    it('should handle provider errors gracefully', async () => {
      await service.connectCalendar(
        mockUserId,
        CalendarProvider.GOOGLE,
        'auth-code',
      );
      googleProvider.createEvent.mockRejectedValueOnce(
        new Error('API error'),
      );

      const result = await service.createBookingEvent(mockUserId, mockBooking);

      // Should not throw, returns null since Google failed
      expect(result).toBeNull();
    });

    it('should include notes in the event description', async () => {
      await service.connectCalendar(
        mockUserId,
        CalendarProvider.GOOGLE,
        'auth-code',
      );

      await service.createBookingEvent(mockUserId, mockBooking);

      expect(googleProvider.createEvent).toHaveBeenCalledWith(
        mockTokens,
        expect.objectContaining({
          description: expect.stringContaining('Weekly team standup'),
        }),
      );
    });
  });

  // =========================================================================
  // updateBookingEvent
  // =========================================================================

  describe('updateBookingEvent', () => {
    it('should update event on connected calendars', async () => {
      await service.connectCalendar(
        mockUserId,
        CalendarProvider.GOOGLE,
        'auth-code',
      );

      await service.updateBookingEvent(mockUserId, 'event-123', {
        resourceName: 'Meeting Room B',
        locationName: 'D Block Stamba',
        locationAddress: '14 Merab Kostava St',
        startTime: new Date('2025-06-15T14:00:00Z'),
        endTime: new Date('2025-06-15T16:00:00Z'),
      });

      expect(googleProvider.updateEvent).toHaveBeenCalledWith(
        mockTokens,
        'event-123',
        expect.objectContaining({
          title: 'Room Booking - Meeting Room B',
        }),
      );
    });
  });

  // =========================================================================
  // deleteBookingEvent
  // =========================================================================

  describe('deleteBookingEvent', () => {
    it('should delete event on connected calendars', async () => {
      await service.connectCalendar(
        mockUserId,
        CalendarProvider.GOOGLE,
        'auth-code',
      );

      await service.deleteBookingEvent(mockUserId, 'event-123');

      expect(googleProvider.deleteEvent).toHaveBeenCalledWith(
        mockTokens,
        'event-123',
      );
    });
  });

  // =========================================================================
  // generateICalForBooking
  // =========================================================================

  describe('generateICalForBooking', () => {
    it('should generate .ics content for a booking', () => {
      const result = service.generateICalForBooking(mockBooking);

      expect(result).toContain('BEGIN:VCALENDAR');
      expect(icalGenerator.generateICalEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Room Booking - Meeting Room A',
        }),
      );
    });
  });

  // =========================================================================
  // generateICalFeedForUser
  // =========================================================================

  describe('generateICalFeedForUser', () => {
    it('should generate a feed from multiple bookings', () => {
      const bookings = [mockBooking, { ...mockBooking, id: 'booking-002' }];

      const result = service.generateICalFeedForUser(bookings);

      expect(result).toContain('BEGIN:VCALENDAR');
      expect(icalGenerator.generateICalFeed).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ title: 'Room Booking - Meeting Room A' }),
        ]),
      );
    });
  });
});
