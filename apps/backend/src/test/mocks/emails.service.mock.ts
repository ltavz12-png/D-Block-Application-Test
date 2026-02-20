import { EmailsService } from '@/modules/emails/emails.service';

/**
 * Mock EmailsService with all public methods stubbed as jest.fn().
 * Use with `{ provide: EmailsService, useValue: mockEmailsService }`.
 */
export const mockEmailsService: jest.Mocked<Partial<EmailsService>> = {
  sendEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'mock-msg-id' }),
  sendTemplatedEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'mock-msg-id' }),
  sendBookingConfirmation: jest.fn().mockResolvedValue(undefined),
  sendBookingReminder: jest.fn().mockResolvedValue(undefined),
  sendBookingCancellation: jest.fn().mockResolvedValue(undefined),
  sendPaymentReceipt: jest.fn().mockResolvedValue(undefined),
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordReset: jest.fn().mockResolvedValue(undefined),
  sendInvoiceEmail: jest.fn().mockResolvedValue(undefined),
  sendVisitorInvitation: jest.fn().mockResolvedValue(undefined),
  sendPassExpiringNotice: jest.fn().mockResolvedValue(undefined),
};

/**
 * Creates a fresh mock EmailsService instance (useful when you need to reset between tests).
 */
export function createMockEmailsService(): jest.Mocked<Partial<EmailsService>> {
  return {
    sendEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'mock-msg-id' }),
    sendTemplatedEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'mock-msg-id' }),
    sendBookingConfirmation: jest.fn().mockResolvedValue(undefined),
    sendBookingReminder: jest.fn().mockResolvedValue(undefined),
    sendBookingCancellation: jest.fn().mockResolvedValue(undefined),
    sendPaymentReceipt: jest.fn().mockResolvedValue(undefined),
    sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordReset: jest.fn().mockResolvedValue(undefined),
    sendInvoiceEmail: jest.fn().mockResolvedValue(undefined),
    sendVisitorInvitation: jest.fn().mockResolvedValue(undefined),
    sendPassExpiringNotice: jest.fn().mockResolvedValue(undefined),
  };
}
