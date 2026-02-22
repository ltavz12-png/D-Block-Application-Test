import { Injectable, Logger } from '@nestjs/common';
import {
  IPushNotificationProvider,
  PushResult,
  PushMultipleResult,
} from './push-notification.provider';
import { MockPushProvider } from './mock-push.provider';

@Injectable()
export class FcmPushProvider implements IPushNotificationProvider {
  private readonly logger = new Logger(FcmPushProvider.name);
  private readonly mockFallback: MockPushProvider;
  private firebaseApp: any = null;
  private isInitialized = false;

  constructor() {
    this.mockFallback = new MockPushProvider();
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    try {
      const credentialsPath = process.env.FIREBASE_CREDENTIALS_PATH;
      const projectId = process.env.FIREBASE_PROJECT_ID;

      if (!credentialsPath && !projectId) {
        this.logger.warn(
          'Firebase credentials not configured (FIREBASE_CREDENTIALS_PATH or FIREBASE_PROJECT_ID). Falling back to mock push provider.',
        );
        return;
      }

      // Attempt to load firebase-admin dynamically
       
      const admin = require('firebase-admin');

      if (!admin.apps.length) {
        const initOptions: any = {};

        if (credentialsPath) {
           
          const serviceAccount = require(credentialsPath);
          initOptions.credential = admin.credential.cert(serviceAccount);
        }

        if (projectId) {
          initOptions.projectId = projectId;
        }

        this.firebaseApp = admin.initializeApp(initOptions);
      } else {
        this.firebaseApp = admin.app();
      }

      this.isInitialized = true;
      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (error) {
      this.logger.warn(
        `Failed to initialize Firebase Admin SDK: ${error instanceof Error ? error.message : String(error)}. Falling back to mock push provider.`,
      );
      this.isInitialized = false;
    }
  }

  async sendPush(
    deviceToken: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<PushResult> {
    if (!this.isInitialized || !this.firebaseApp) {
      this.logger.debug('[FCM] Not initialized — using mock fallback');
      return this.mockFallback.sendPush(deviceToken, title, body, data);
    }

    try {
       
      const admin = require('firebase-admin');
      const messaging = admin.messaging();

      const message: any = {
        token: deviceToken,
        notification: {
          title,
          body,
        },
      };

      if (data) {
        message.data = Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)]),
        );
      }

      const messageId = await messaging.send(message);

      this.logger.log(
        `[FCM] Push sent successfully | token=${deviceToken.substring(0, 8)}... | messageId=${messageId}`,
      );

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`[FCM] Failed to send push: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async sendMultiple(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<PushMultipleResult> {
    if (!this.isInitialized || !this.firebaseApp) {
      this.logger.debug('[FCM] Not initialized — using mock fallback');
      return this.mockFallback.sendMultiple(tokens, title, body, data);
    }

    try {
       
      const admin = require('firebase-admin');
      const messaging = admin.messaging();

      const message: any = {
        tokens,
        notification: {
          title,
          body,
        },
      };

      if (data) {
        message.data = Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)]),
        );
      }

      const response = await messaging.sendEachForMulticast(message);

      this.logger.log(
        `[FCM] Multicast sent | total=${tokens.length} | success=${response.successCount} | failure=${response.failureCount}`,
      );

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`[FCM] Failed to send multicast: ${errorMessage}`);

      return {
        successCount: 0,
        failureCount: tokens.length,
      };
    }
  }
}
