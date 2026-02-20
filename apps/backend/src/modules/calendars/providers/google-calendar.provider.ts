import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ICalendarProvider,
  CalendarEvent,
  CalendarTokens,
} from './calendar-provider.interface';

@Injectable()
export class GoogleCalendarProvider implements ICalendarProvider {
  private readonly logger = new Logger(GoogleCalendarProvider.name);
  private readonly clientId: string | undefined;
  private readonly clientSecret: string | undefined;
  private readonly redirectUri: string | undefined;
  private readonly isMock: boolean;

  private static readonly AUTH_URL =
    'https://accounts.google.com/o/oauth2/v2/auth';
  private static readonly TOKEN_URL =
    'https://oauth2.googleapis.com/token';
  private static readonly EVENTS_BASE_URL =
    'https://www.googleapis.com/calendar/v3/calendars/primary/events';
  private static readonly SCOPE =
    'https://www.googleapis.com/auth/calendar.events';

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>(
      'GOOGLE_CALENDAR_CLIENT_ID',
    );
    this.clientSecret = this.configService.get<string>(
      'GOOGLE_CALENDAR_CLIENT_SECRET',
    );
    this.redirectUri = this.configService.get<string>(
      'GOOGLE_CALENDAR_REDIRECT_URI',
    );

    this.isMock = !this.clientId || !this.clientSecret || !this.redirectUri;

    if (this.isMock) {
      this.logger.warn(
        'Google Calendar credentials not configured. Using mock responses.',
      );
    }
  }

  getAuthUrl(state: string): string {
    if (this.isMock) {
      return `https://accounts.google.com/o/oauth2/v2/auth?mock=true&state=${encodeURIComponent(state)}`;
    }

    const params = new URLSearchParams({
      client_id: this.clientId!,
      redirect_uri: this.redirectUri!,
      response_type: 'code',
      scope: GoogleCalendarProvider.SCOPE,
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    return `${GoogleCalendarProvider.AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<CalendarTokens> {
    if (this.isMock) {
      this.logger.warn(
        'Google Calendar: Returning mock tokens (credentials not configured)',
      );
      return {
        accessToken: `mock_google_access_token_${Date.now()}`,
        refreshToken: `mock_google_refresh_token_${Date.now()}`,
        expiresAt: new Date(Date.now() + 3600 * 1000),
      };
    }

    const response = await fetch(GoogleCalendarProvider.TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.clientId!,
        client_secret: this.clientSecret!,
        redirect_uri: this.redirectUri!,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(
        `Google Calendar token exchange failed: ${response.status} ${errorBody}`,
      );
      throw new Error(
        `Google Calendar token exchange failed: ${response.status}`,
      );
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<CalendarTokens> {
    if (this.isMock) {
      this.logger.warn(
        'Google Calendar: Returning mock refreshed tokens (credentials not configured)',
      );
      return {
        accessToken: `mock_google_access_token_refreshed_${Date.now()}`,
        refreshToken,
        expiresAt: new Date(Date.now() + 3600 * 1000),
      };
    }

    const response = await fetch(GoogleCalendarProvider.TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId!,
        client_secret: this.clientSecret!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(
        `Google Calendar token refresh failed: ${response.status} ${errorBody}`,
      );
      throw new Error(
        `Google Calendar token refresh failed: ${response.status}`,
      );
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  async createEvent(
    tokens: CalendarTokens,
    event: CalendarEvent,
  ): Promise<string> {
    if (this.isMock) {
      const mockId = `mock_google_event_${Date.now()}`;
      this.logger.warn(
        `Google Calendar: Returning mock event ID ${mockId} (credentials not configured)`,
      );
      return mockId;
    }

    const validTokens = await this.ensureValidTokens(tokens);
    const body = this.mapToGoogleEvent(event);

    const response = await fetch(GoogleCalendarProvider.EVENTS_BASE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${validTokens.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(
        `Google Calendar createEvent failed: ${response.status} ${errorBody}`,
      );
      throw new Error(
        `Google Calendar createEvent failed: ${response.status}`,
      );
    }

    const data = await response.json();
    return data.id;
  }

  async updateEvent(
    tokens: CalendarTokens,
    eventId: string,
    event: CalendarEvent,
  ): Promise<void> {
    if (this.isMock) {
      this.logger.warn(
        `Google Calendar: Mock update for event ${eventId} (credentials not configured)`,
      );
      return;
    }

    const validTokens = await this.ensureValidTokens(tokens);
    const body = this.mapToGoogleEvent(event);

    const response = await fetch(
      `${GoogleCalendarProvider.EVENTS_BASE_URL}/${encodeURIComponent(eventId)}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${validTokens.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(
        `Google Calendar updateEvent failed: ${response.status} ${errorBody}`,
      );
      throw new Error(
        `Google Calendar updateEvent failed: ${response.status}`,
      );
    }
  }

  async deleteEvent(
    tokens: CalendarTokens,
    eventId: string,
  ): Promise<void> {
    if (this.isMock) {
      this.logger.warn(
        `Google Calendar: Mock delete for event ${eventId} (credentials not configured)`,
      );
      return;
    }

    const validTokens = await this.ensureValidTokens(tokens);

    const response = await fetch(
      `${GoogleCalendarProvider.EVENTS_BASE_URL}/${encodeURIComponent(eventId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${validTokens.accessToken}`,
        },
      },
    );

    if (!response.ok && response.status !== 410) {
      const errorBody = await response.text();
      this.logger.error(
        `Google Calendar deleteEvent failed: ${response.status} ${errorBody}`,
      );
      throw new Error(
        `Google Calendar deleteEvent failed: ${response.status}`,
      );
    }
  }

  async listEvents(
    tokens: CalendarTokens,
    timeMin: Date,
    timeMax: Date,
  ): Promise<CalendarEvent[]> {
    if (this.isMock) {
      this.logger.warn(
        'Google Calendar: Returning empty mock events list (credentials not configured)',
      );
      return [];
    }

    const validTokens = await this.ensureValidTokens(tokens);

    const params = new URLSearchParams({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    const response = await fetch(
      `${GoogleCalendarProvider.EVENTS_BASE_URL}?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${validTokens.accessToken}`,
        },
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(
        `Google Calendar listEvents failed: ${response.status} ${errorBody}`,
      );
      throw new Error(
        `Google Calendar listEvents failed: ${response.status}`,
      );
    }

    const data = await response.json();
    const items: any[] = data.items || [];

    return items.map((item) => this.mapFromGoogleEvent(item));
  }

  private mapToGoogleEvent(
    event: CalendarEvent,
  ): Record<string, any> {
    const googleEvent: Record<string, any> = {
      summary: event.title,
      start: {
        dateTime: event.startTime.toISOString(),
        timeZone: event.timeZone || 'Asia/Tbilisi',
      },
      end: {
        dateTime: event.endTime.toISOString(),
        timeZone: event.timeZone || 'Asia/Tbilisi',
      },
    };

    if (event.description) {
      googleEvent.description = event.description;
    }

    if (event.location) {
      googleEvent.location = event.location;
    }

    if (event.attendees && event.attendees.length > 0) {
      googleEvent.attendees = event.attendees.map((email) => ({ email }));
    }

    if (event.reminders && event.reminders.length > 0) {
      googleEvent.reminders = {
        useDefault: false,
        overrides: event.reminders.map((r) => ({
          method: r.method,
          minutes: r.minutes,
        })),
      };
    }

    return googleEvent;
  }

  private mapFromGoogleEvent(item: any): CalendarEvent {
    return {
      id: item.id,
      title: item.summary || '',
      description: item.description || undefined,
      location: item.location || undefined,
      startTime: new Date(
        item.start?.dateTime || item.start?.date,
      ),
      endTime: new Date(item.end?.dateTime || item.end?.date),
      timeZone: item.start?.timeZone || undefined,
      attendees: item.attendees
        ? item.attendees.map((a: any) => a.email)
        : undefined,
    };
  }

  private async ensureValidTokens(
    tokens: CalendarTokens,
  ): Promise<CalendarTokens> {
    if (tokens.expiresAt > new Date()) {
      return tokens;
    }

    this.logger.log('Google Calendar: Access token expired, refreshing...');
    return this.refreshAccessToken(tokens.refreshToken);
  }
}
