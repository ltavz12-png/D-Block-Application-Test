export enum CalendarProvider {
  GOOGLE = 'google',
  OUTLOOK = 'outlook',
  APPLE = 'apple',
}

export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  location?: string;
  startTime: Date;
  endTime: Date;
  timeZone?: string;
  attendees?: string[];
  reminders?: { method: 'email' | 'popup'; minutes: number }[];
}

export interface CalendarTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface ICalendarProvider {
  getAuthUrl(state: string): string;
  exchangeCodeForTokens(code: string): Promise<CalendarTokens>;
  refreshAccessToken(refreshToken: string): Promise<CalendarTokens>;
  createEvent(tokens: CalendarTokens, event: CalendarEvent): Promise<string>;
  updateEvent(
    tokens: CalendarTokens,
    eventId: string,
    event: CalendarEvent,
  ): Promise<void>;
  deleteEvent(tokens: CalendarTokens, eventId: string): Promise<void>;
  listEvents(
    tokens: CalendarTokens,
    timeMin: Date,
    timeMax: Date,
  ): Promise<CalendarEvent[]>;
}
