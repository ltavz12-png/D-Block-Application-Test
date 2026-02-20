import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  IEmailProvider,
  EmailMessage,
  EmailDeliveryResult,
} from './email-provider.interface';

@Injectable()
export class MockEmailProvider implements IEmailProvider {
  private readonly logger = new Logger(MockEmailProvider.name);
  private readonly sentEmails: Array<EmailMessage & { messageId: string; sentAt: Date }> = [];

  async send(message: EmailMessage): Promise<EmailDeliveryResult> {
    const messageId = `mock_${uuidv4()}`;
    const timestamp = new Date();

    this.logger.log('--- MOCK EMAIL SENT ---');
    this.logger.log(`Message ID: ${messageId}`);
    this.logger.log(`To: ${message.to.map((r) => `${r.name || ''} <${r.email}>`).join(', ')}`);
    if (message.cc?.length) {
      this.logger.log(`CC: ${message.cc.map((r) => `${r.name || ''} <${r.email}>`).join(', ')}`);
    }
    if (message.bcc?.length) {
      this.logger.log(`BCC: ${message.bcc.map((r) => `${r.name || ''} <${r.email}>`).join(', ')}`);
    }
    this.logger.log(`Subject: ${message.subject}`);
    if (message.templateId) {
      this.logger.log(`Template ID: ${message.templateId}`);
      this.logger.log(`Template Data: ${JSON.stringify(message.templateData)}`);
    }
    if (message.attachments?.length) {
      this.logger.log(`Attachments: ${message.attachments.map((a) => a.filename).join(', ')}`);
    }
    if (message.tags?.length) {
      this.logger.log(`Tags: ${message.tags.join(', ')}`);
    }
    this.logger.log(`HTML length: ${message.html?.length || 0} chars`);
    this.logger.log('--- END MOCK EMAIL ---');

    this.sentEmails.push({ ...message, messageId, sentAt: timestamp });

    return {
      messageId,
      status: 'sent',
      timestamp,
    };
  }

  async sendBatch(messages: EmailMessage[]): Promise<EmailDeliveryResult[]> {
    this.logger.log(`Sending batch of ${messages.length} mock emails`);
    const results: EmailDeliveryResult[] = [];

    for (const message of messages) {
      const result = await this.send(message);
      results.push(result);
    }

    return results;
  }

  getSentEmails(): Array<EmailMessage & { messageId: string; sentAt: Date }> {
    return [...this.sentEmails];
  }

  clearSentEmails(): void {
    this.sentEmails.length = 0;
  }
}
