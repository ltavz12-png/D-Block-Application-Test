import { Injectable, Logger } from '@nestjs/common';
import { IAnalyticsProvider, AnalyticsTrackEventPayload } from './analytics.provider';
import { MockAnalyticsProvider } from './mock-analytics.provider';

@Injectable()
export class FirebaseAnalyticsProvider implements IAnalyticsProvider {
  private readonly logger = new Logger(FirebaseAnalyticsProvider.name);
  private firebaseApp: any = null;
  private readonly fallback: MockAnalyticsProvider;
  private readonly isConfigured: boolean;

  constructor() {
    this.fallback = new MockAnalyticsProvider();

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (projectId) {
      try {
        // Dynamic import to avoid hard dependency
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const admin = require('firebase-admin');

        if (!admin.apps.length) {
          const initOptions: any = { projectId };

          if (credentialPath) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const serviceAccount = require(credentialPath);
            initOptions.credential = admin.credential.cert(serviceAccount);
          } else {
            initOptions.credential = admin.credential.applicationDefault();
          }

          this.firebaseApp = admin.initializeApp(initOptions, 'analytics');
        } else {
          this.firebaseApp = admin.app('analytics') || admin.apps[0];
        }

        this.isConfigured = true;
        this.logger.log('Firebase Analytics provider initialized (server-side event logging)');
      } catch (error) {
        this.logger.warn(
          `Firebase Admin SDK not available or misconfigured. Falling back to mock provider. ` +
          `Error: ${error instanceof Error ? error.message : String(error)}`,
        );
        this.isConfigured = false;
      }
    } else {
      this.logger.warn('FIREBASE_PROJECT_ID not set. Using mock analytics provider as fallback.');
      this.isConfigured = false;
    }
  }

  async trackEvent(event: AnalyticsTrackEventPayload): Promise<void> {
    if (!this.isConfigured || !this.firebaseApp) {
      return this.fallback.trackEvent(event);
    }

    try {
      // Firebase Analytics is primarily client-side.
      // Server-side, we log key conversion events via Firestore or BigQuery export.
      // For server-side tracking, we write to a Firestore collection as a proxy.
      const firestore = this.firebaseApp.firestore();
      await firestore.collection('server_analytics_events').add({
        event_name: event.name,
        user_id: event.userId || null,
        properties: event.properties || {},
        timestamp: new Date(),
      });

      this.logger.debug(
        `[Firebase] Logged server event "${event.name}" for user ${event.userId || 'anonymous'}`,
      );
    } catch (error) {
      this.logger.error(
        `Firebase trackEvent failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      await this.fallback.trackEvent(event);
    }
  }

  async identifyUser(userId: string, traits: Record<string, any>): Promise<void> {
    if (!this.isConfigured || !this.firebaseApp) {
      return this.fallback.identifyUser(userId, traits);
    }

    try {
      // Store user traits in Firestore user_profiles collection
      const firestore = this.firebaseApp.firestore();
      await firestore.collection('analytics_user_profiles').doc(userId).set(
        {
          ...traits,
          last_identified_at: new Date(),
        },
        { merge: true },
      );

      this.logger.debug(`[Firebase] Identified user "${userId}" with traits`);
    } catch (error) {
      this.logger.error(
        `Firebase identifyUser failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      await this.fallback.identifyUser(userId, traits);
    }
  }

  async trackPageView(userId: string, page: string, properties?: Record<string, any>): Promise<void> {
    if (!this.isConfigured || !this.firebaseApp) {
      return this.fallback.trackPageView(userId, page, properties);
    }

    try {
      const firestore = this.firebaseApp.firestore();
      await firestore.collection('server_analytics_events').add({
        event_name: 'page_view',
        user_id: userId,
        properties: {
          ...properties,
          page,
        },
        timestamp: new Date(),
      });

      this.logger.debug(`[Firebase] Page view "${page}" by user "${userId}"`);
    } catch (error) {
      this.logger.error(
        `Firebase trackPageView failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      await this.fallback.trackPageView(userId, page, properties);
    }
  }
}
