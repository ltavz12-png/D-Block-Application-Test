import { Injectable, Logger } from '@nestjs/common';
import {
  IPushNotificationProvider,
  PushResult,
  PushMultipleResult,
} from './push-notification.provider';

@Injectable()
export class MockPushProvider implements IPushNotificationProvider {
  private readonly logger = new Logger(MockPushProvider.name);

  async sendPush(
    deviceToken: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<PushResult> {
    const delay = Math.floor(Math.random() * 50) + 50;
    await new Promise((resolve) => setTimeout(resolve, delay));

    const messageId = `mock_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    this.logger.log(
      `[MOCK PUSH] Sent to token=${deviceToken.substring(0, 8)}... | title="${title}" | body="${body.substring(0, 50)}..." | messageId=${messageId}`,
    );

    if (data) {
      this.logger.debug(`[MOCK PUSH] Data payload: ${JSON.stringify(data)}`);
    }

    return {
      success: true,
      messageId,
    };
  }

  async sendMultiple(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<PushMultipleResult> {
    const delay = Math.floor(Math.random() * 50) + 50;
    await new Promise((resolve) => setTimeout(resolve, delay));

    this.logger.log(
      `[MOCK PUSH] Multicast to ${tokens.length} devices | title="${title}" | body="${body.substring(0, 50)}..."`,
    );

    if (data) {
      this.logger.debug(`[MOCK PUSH] Data payload: ${JSON.stringify(data)}`);
    }

    return {
      successCount: tokens.length,
      failureCount: 0,
    };
  }
}
