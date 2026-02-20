import { Injectable, Logger } from '@nestjs/common';
import { IAnalyticsProvider, AnalyticsTrackEventPayload } from './analytics.provider';

interface StoredEvent {
  name: string;
  userId?: string;
  properties?: Record<string, any>;
  timestamp: Date;
}

@Injectable()
export class MockAnalyticsProvider implements IAnalyticsProvider {
  private readonly logger = new Logger(MockAnalyticsProvider.name);
  private readonly events: StoredEvent[] = [];
  private readonly identifiedUsers: Map<string, Record<string, any>> = new Map();
  private readonly pageViews: StoredEvent[] = [];

  async trackEvent(event: AnalyticsTrackEventPayload): Promise<void> {
    const delay = Math.floor(Math.random() * 40) + 10;
    await new Promise((resolve) => setTimeout(resolve, delay));

    const stored: StoredEvent = {
      name: event.name,
      userId: event.userId,
      properties: event.properties,
      timestamp: new Date(),
    };

    this.events.push(stored);
    this.logger.debug(
      `[Mock] Tracked event "${event.name}" for user ${event.userId || 'anonymous'} ` +
      `(${JSON.stringify(event.properties || {})}) [${delay}ms]`,
    );
  }

  async identifyUser(userId: string, traits: Record<string, any>): Promise<void> {
    const delay = Math.floor(Math.random() * 40) + 10;
    await new Promise((resolve) => setTimeout(resolve, delay));

    const existing = this.identifiedUsers.get(userId) || {};
    this.identifiedUsers.set(userId, { ...existing, ...traits });
    this.logger.debug(
      `[Mock] Identified user "${userId}" with traits: ${JSON.stringify(traits)} [${delay}ms]`,
    );
  }

  async trackPageView(userId: string, page: string, properties?: Record<string, any>): Promise<void> {
    const delay = Math.floor(Math.random() * 40) + 10;
    await new Promise((resolve) => setTimeout(resolve, delay));

    const stored: StoredEvent = {
      name: `$pageview:${page}`,
      userId,
      properties: { ...properties, page },
      timestamp: new Date(),
    };

    this.pageViews.push(stored);
    this.logger.debug(
      `[Mock] Page view "${page}" by user "${userId}" ` +
      `(${JSON.stringify(properties || {})}) [${delay}ms]`,
    );
  }

  getEventCount(): number {
    return this.events.length;
  }

  getPageViewCount(): number {
    return this.pageViews.length;
  }

  getIdentifiedUserCount(): number {
    return this.identifiedUsers.size;
  }

  getStats(): { events: number; pageViews: number; identifiedUsers: number } {
    return {
      events: this.events.length,
      pageViews: this.pageViews.length,
      identifiedUsers: this.identifiedUsers.size,
    };
  }
}
