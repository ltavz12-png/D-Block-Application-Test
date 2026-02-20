import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IEmailProvider,
  EmailMessage,
  EmailDeliveryResult,
} from './email-provider.interface';
import { MockEmailProvider } from './mock-email.provider';

@Injectable()
export class SendGridProvider implements IEmailProvider {
  private readonly logger = new Logger(SendGridProvider.name);
  private readonly apiKey: string;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly emailMode: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly mockProvider: MockEmailProvider,
  ) {
    this.apiKey = this.configService.get<string>('integrations.email.sendgridApiKey', '');
    this.fromEmail = this.configService.get<string>('integrations.email.fromEmail', 'noreply@dblock.com');
    this.fromName = this.configService.get<string>('integrations.email.fromName', 'D Block Workspace');
    this.emailMode = this.configService.get<string>('integrations.email.mode', 'mock');

    if (this.emailMode === 'mock' || !this.apiKey) {
      this.logger.warn('Email running in MOCK mode — no real emails will be sent');
    } else {
      this.logger.log('SendGrid provider initialized with live API key');
    }
  }

  private shouldUseMock(): boolean {
    return this.emailMode === 'mock' || !this.apiKey;
  }

  async send(message: EmailMessage): Promise<EmailDeliveryResult> {
    if (this.shouldUseMock()) {
      return this.mockProvider.send(message);
    }

    try {
      const body = this.buildSendGridPayload(message);

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logger.error(`SendGrid API error: ${response.status} - ${errorBody}`);
        return {
          messageId: '',
          status: 'failed',
          timestamp: new Date(),
        };
      }

      const messageId = response.headers.get('x-message-id') || `sg_${Date.now()}`;

      this.logger.log(`Email sent via SendGrid to ${message.to.map((r) => r.email).join(', ')} [${messageId}]`);

      return {
        messageId,
        status: 'sent',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`SendGrid send failed: ${error instanceof Error ? error.message : String(error)}`);
      return {
        messageId: '',
        status: 'failed',
        timestamp: new Date(),
      };
    }
  }

  async sendBatch(messages: EmailMessage[]): Promise<EmailDeliveryResult[]> {
    if (this.shouldUseMock()) {
      return this.mockProvider.sendBatch(messages);
    }

    this.logger.log(`Sending batch of ${messages.length} emails via SendGrid`);
    const results: EmailDeliveryResult[] = [];

    for (const message of messages) {
      const result = await this.send(message);
      results.push(result);
    }

    return results;
  }

  private buildSendGridPayload(message: EmailMessage): Record<string, any> {
    const personalizations: Record<string, any>[] = [
      {
        to: message.to.map((r) => ({
          email: r.email,
          ...(r.name ? { name: r.name } : {}),
        })),
      },
    ];

    if (message.cc?.length) {
      personalizations[0].cc = message.cc.map((r) => ({
        email: r.email,
        ...(r.name ? { name: r.name } : {}),
      }));
    }

    if (message.bcc?.length) {
      personalizations[0].bcc = message.bcc.map((r) => ({
        email: r.email,
        ...(r.name ? { name: r.name } : {}),
      }));
    }

    if (message.templateData) {
      personalizations[0].dynamic_template_data = message.templateData;
    }

    const payload: Record<string, any> = {
      personalizations,
      from: {
        email: this.fromEmail,
        name: this.fromName,
      },
      subject: message.subject,
      content: [
        ...(message.text
          ? [{ type: 'text/plain', value: message.text }]
          : []),
        { type: 'text/html', value: message.html },
      ],
    };

    if (message.templateId) {
      payload.template_id = message.templateId;
    }

    if (message.attachments?.length) {
      payload.attachments = message.attachments.map((a) => ({
        content: a.content,
        filename: a.filename,
        type: a.type,
        disposition: 'attachment',
      }));
    }

    if (message.tags?.length) {
      payload.categories = message.tags;
    }

    return payload;
  }
}
