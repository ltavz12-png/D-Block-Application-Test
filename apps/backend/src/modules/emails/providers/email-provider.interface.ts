export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  content: string; // base64 encoded
  type: string; // MIME type
}

export interface EmailMessage {
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  subject: string;
  html: string;
  text?: string;
  templateId?: string;
  templateData?: Record<string, any>;
  attachments?: EmailAttachment[];
  tags?: string[];
}

export interface EmailDeliveryResult {
  messageId: string;
  status: 'sent' | 'queued' | 'failed';
  timestamp: Date;
}

export interface IEmailProvider {
  send(message: EmailMessage): Promise<EmailDeliveryResult>;
  sendBatch(messages: EmailMessage[]): Promise<EmailDeliveryResult[]>;
}
