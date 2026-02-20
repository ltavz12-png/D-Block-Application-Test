export interface AnalyticsTrackEventPayload {
  name: string;
  userId?: string;
  properties?: Record<string, any>;
}

export interface IAnalyticsProvider {
  trackEvent(event: AnalyticsTrackEventPayload): Promise<void>;
  identifyUser(userId: string, traits: Record<string, any>): Promise<void>;
  trackPageView(userId: string, page: string, properties?: Record<string, any>): Promise<void>;
}

export const ANALYTICS_PROVIDER = 'ANALYTICS_PROVIDER';
