import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ICalendarProvider,
  CalendarEvent,
  CalendarTokens,
} from './calendar-provider.interface';

@Injectable()
export class OutlookCalendarProvider implements ICalendarProvider {
  private readonly logger = new Logger(OutlookCalendarProvider.name);
  private readonly clientId: string | undefined;
  private readonly clientSecret: string | undefined;
  private readonly redirectUri: string | undefined;
  private readonly isMock: boolean;

  private static readonly AUTH_URL =
    'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
  private static readonly TOKEN_URL =
    'https://login.microsoftonline.com/common/oauth2/v2.0/token';
  private static readonly EVENTS_BASE_URL =
    'https://graph.microsoft.com/v1.0/me/events';
  private static readonly SCOPE = 'Calendars.ReadWrite offline_access';

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>(
      'MICROSOFT_GRAPH_CLIENT_ID',
    );
    this.clientSecret = this.configService.get<string>(
      'MICROSOFT_GRAPH_CLIENT_SECRET',
    );
    this.redirectUri = this.configService.get<string>(
      'MICROSOFT_GRAPH_REDIRECT_URI',
    );

    this.isMock = !this.clientId || !this.clientSecret || !this.redirectUri;

    if (this.isMock) {
      this.logger.warn(
        'Outlook Calendar credentials not configured. Using mock responses.',
      );
    }
  }

  getAuthUrl(state: string): string {
    if (this.isMock) {
      return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?mock=true&state=${encodeURIComponent(state)}`;
    }

    const params = new URLSearchParams({
      client_id: this.clientId!,
      redirect_uri: this.redirectUri!,
      response_type: 'code',
      scope: OutlookCalendarProvider.SCOPE,
      response_mode: 'query',
      state,
    });

    return `${OutlookCalendarProvider.AUTH_URL}?${params.toString()}`;
  }

  async exchangeCodeForTokens(code: string): Promise<CalendarTokens> {
    if (this.isMock) {
      this.logger.warn(
        'Outlook Calendar: Returning mock tokens (credentials not configured)',
      );
      return {
        accessToken: `mock_outlook_access_token_${Date.now()}`,
        refreshToken: `mock_outlook_refresh_token_${Date.now()}`,
        expiresAt: new Date(Date.now() + 3600 * 1000),
      };
    }

    const response = await fetch(OutlookCalendarProvider.TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.clientId!,
        client_secret: this.clientSecret!,
        redirect_uri: this.redirectUri!,
        grant_type: 'authorization_code',
        scope: OutlookCalendarProvider.SCOPE,
      }).toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(
        `Outlook Calendar token exchange failed: ${response.status} ${errorBody}`,
      );
      throw new Error(
        `Outlook Calendar token exchange failed: ${response.status}`,
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
        'Outlook Calendar: Returning mock refreshed tokens (credentials not configured)',
      );
      return {
        accessToken: `mock_outlook_access_token_refreshed_${Date.now()}`,
        refreshToken,
        expiresAt: new Date(Date.now() + 3600 * 1000),
      };
    }

    const response = await fetch(OutlookCalendarProvider.TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId!,
        client_secret: this.clientSecret!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: OutlookCalendarProvider.SCOPE,
      }).toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(
        `Outlook Calendar token refresh failed: ${response.status} ${errorBody}`,
      );
      throw new Error(
        `Outlook Calendar token refresh failed: ${response.status}`,
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
      const mockId = `mock_outlook_event_${Date.now()}`;
      this.logger.warn(
        `Outlook Calendar: Returning mock event ID ${mockId} (credentials not configured)`,
      );
      return mockId;
    }

    const validTokens = await this.ensureValidTokens(tokens);
    const body = this.mapToOutlookEvent(event);

    const response = await fetch(OutlookCalendarProvider.EVENTS_BASE_URL, {
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
        `Outlook Calendar createEvent failed: ${response.status} ${errorBody}`,
      );
      throw new Error(
        `Outlook Calendar createEvent failed: ${response.status}`,
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
        `Outlook Calendar: Mock update for event ${eventId} (credentials not configured)`,
      );
      return;
    }

    const validTokens = await this.ensureValidTokens(tokens);
    const body = this.mapToOutlookEvent(event);

    const response = await fetch(
      `${OutlookCalendarProvider.EVENTS_BASE_URL}/${encodeURIComponent(eventId)}`,
      {
        method: 'PATCH',
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
        `Outlook Calendar updateEvent failed: ${response.status} ${errorBody}`,
      );
      throw new Error(
        `Outlook Calendar updateEvent failed: ${response.status}`,
      );
    }
  }

  async deleteEvent(
    tokens: CalendarTokens,
    eventId: string,
  ): Promise<void> {
    if (this.isMock) {
      this.logger.warn(
        `Outlook Calendar: Mock delete for event ${eventId} (credentials not configured)`,
      );
      return;
    }

    const validTokens = await this.ensureValidTokens(tokens);

    const response = await fetch(
      `${OutlookCalendarProvider.EVENTS_BASE_URL}/${encodeURIComponent(eventId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${validTokens.accessToken}`,
        },
      },
    );

    if (!response.ok && response.status !== 404) {
      const errorBody = await response.text();
      this.logger.error(
        `Outlook Calendar deleteEvent failed: ${response.status} ${errorBody}`,
      );
      throw new Error(
        `Outlook Calendar deleteEvent failed: ${response.status}`,
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
        'Outlook Calendar: Returning empty mock events list (credentials not configured)',
      );
      return [];
    }

    const validTokens = await this.ensureValidTokens(tokens);

    const filter = `start/dateTime ge '${timeMin.toISOString()}' and end/dateTime le '${timeMax.toISOString()}'`;
    const params = new URLSearchParams({
      $filter: filter,
      $orderby: 'start/dateTime',
      $top: '100',
    });

    const response = await fetch(
      `${OutlookCalendarProvider.EVENTS_BASE_URL}?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${validTokens.accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(
        `Outlook Calendar listEvents failed: ${response.status} ${errorBody}`,
      );
      throw new Error(
        `Outlook Calendar listEvents failed: ${response.status}`,
      );
    }

    const data = await response.json();
    const items: any[] = data.value || [];

    return items.map((item) => this.mapFromOutlookEvent(item));
  }

  private mapToOutlookEvent(
    event: CalendarEvent,
  ): Record<string, any> {
    const timeZone = event.timeZone || 'Asia/Tbilisi';

    const outlookEvent: Record<string, any> = {
      subject: event.title,
      start: {
        dateTime: event.startTime.toISOString(),
        timeZone,
      },
      end: {
        dateTime: event.endTime.toISOString(),
        timeZone,
      },
    };

    if (event.description) {
      outlookEvent.body = {
        contentType: 'text',
        content: event.description,
      };
    }

    if (event.location) {
      outlookEvent.location = {
        displayName: event.location,
      };
    }

    if (event.attendees && event.attendees.length > 0) {
      outlookEvent.attendees = event.attendees.map((email) => ({
        emailAddress: { address: email },
        type: 'required',
      }));
    }

    if (event.reminders && event.reminders.length > 0) {
      outlookEvent.isReminderOn = true;
      outlookEvent.reminderMinutesBeforeStart = event.reminders[0].minutes;
    }

    return outlookEvent;
  }

  private mapFromOutlookEvent(item: any): CalendarEvent {
    return {
      id: item.id,
      title: item.subject || '',
      description: item.body?.content || undefined,
      location: item.location?.displayName || undefined,
      startTime: new Date(item.start?.dateTime),
      endTime: new Date(item.end?.dateTime),
      timeZone: item.start?.timeZone || undefined,
      attendees: item.attendees
        ? item.attendees.map(
            (a: any) => a.emailAddress?.address,
          ).filter(Boolean)
        : undefined,
    };
  }

  private async ensureValidTokens(
    tokens: CalendarTokens,
  ): Promise<CalendarTokens> {
    if (tokens.expiresAt > new Date()) {
      return tokens;
    }

    this.logger.log('Outlook Calendar: Access token expired, refreshing...');
    return this.refreshAccessToken(tokens.refreshToken);
  }
}
