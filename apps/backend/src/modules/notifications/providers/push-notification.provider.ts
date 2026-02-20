export interface PushResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface PushMultipleResult {
  successCount: number;
  failureCount: number;
}

export interface IPushNotificationProvider {
  sendPush(
    deviceToken: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<PushResult>;

  sendMultiple(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<PushMultipleResult>;
}

export const PUSH_NOTIFICATION_PROVIDER = 'PUSH_NOTIFICATION_PROVIDER';
