import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { IAnalyticsProvider, AnalyticsTrackEventPayload } from './analytics.provider';
import { MockAnalyticsProvider } from './mock-analytics.provider';

@Injectable()
export class PosthogAnalyticsProvider implements IAnalyticsProvider, OnModuleDestroy {
  private readonly logger = new Logger(PosthogAnalyticsProvider.name);
  private posthogClient: any = null;
  private readonly fallback: MockAnalyticsProvider;
  private readonly isConfigured: boolean;

  constructor() {
    this.fallback = new MockAnalyticsProvider();

    const apiKey = process.env.POSTHOG_API_KEY;
    const host = process.env.POSTHOG_HOST || 'https://app.posthog.com';

    if (apiKey) {
      try {
        // Dynamic import to avoid hard dependency
         
        const { PostHog } = require('posthog-node');
        this.posthogClient = new PostHog(apiKey, { host });
        this.isConfigured = true;
        this.logger.log('PostHog analytics provider initialized');
      } catch (error) {
        this.logger.warn(
          'posthog-node package not installed. Falling back to mock provider. ' +
          'Install with: npm install posthog-node',
        );
        this.isConfigured = false;
      }
    } else {
      this.logger.warn('POSTHOG_API_KEY not set. Using mock analytics provider as fallback.');
      this.isConfigured = false;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.posthogClient) {
      try {
        await this.posthogClient.shutdown();
        this.logger.log('PostHog client shut down gracefully');
      } catch (error) {
        this.logger.error(
          `Failed to shut down PostHog client: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }

  async trackEvent(event: AnalyticsTrackEventPayload): Promise<void> {
    if (!this.isConfigured || !this.posthogClient) {
      return this.fallback.trackEvent(event);
    }

    try {
      this.posthogClient.capture({
        distinctId: event.userId || 'anonymous',
        event: event.name,
        properties: event.properties || {},
      });
    } catch (error) {
      this.logger.error(
        `PostHog trackEvent failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      await this.fallback.trackEvent(event);
    }
  }

  async identifyUser(userId: string, traits: Record<string, any>): Promise<void> {
    if (!this.isConfigured || !this.posthogClient) {
      return this.fallback.identifyUser(userId, traits);
    }

    try {
      this.posthogClient.identify({
        distinctId: userId,
        properties: traits,
      });
    } catch (error) {
      this.logger.error(
        `PostHog identifyUser failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      await this.fallback.identifyUser(userId, traits);
    }
  }

  async trackPageView(userId: string, page: string, properties?: Record<string, any>): Promise<void> {
    if (!this.isConfigured || !this.posthogClient) {
      return this.fallback.trackPageView(userId, page, properties);
    }

    try {
      this.posthogClient.capture({
        distinctId: userId,
        event: '$pageview',
        properties: {
          ...properties,
          $current_url: page,
        },
      });
    } catch (error) {
      this.logger.error(
        `PostHog trackPageView failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      await this.fallback.trackPageView(userId, page, properties);
    }
  }
}
