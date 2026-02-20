import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EmailsService } from './emails.service';
import {
  Notification,
  NotificationType,
  NotificationChannel,
} from '@/common/database/entities/notification.entity';
import { SendGridProvider } from './providers/sendgrid.provider';
import { EmailTemplatesService } from './email-templates.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockUserId = 'user-0001-0001-0001-000000000001';

const mockRecipient = {
  email: 'user@example.com',
  name: 'John Doe',
};

const mockDeliveryResult = {
  messageId: 'msg-001',
  status: 'sent',
};

const mockTemplate = {
  subject: 'Test Subject',
  html: '<h1>Test Email</h1>',
};

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('EmailsService', () => {
  let service: EmailsService;
  let sendGridProvider: Record<string, jest.Mock>;
  let templateService: Record<string, jest.Mock>;
  let notificationRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    sendGridProvider = {
      send: jest.fn().mockResolvedValue(mockDeliveryResult),
    };

    templateService = {
      bookingConfirmation: jest.fn().mockReturnValue(mockTemplate),
      bookingReminder: jest.fn().mockReturnValue(mockTemplate),
      bookingCancellation: jest.fn().mockReturnValue(mockTemplate),
      paymentReceipt: jest.fn().mockReturnValue(mockTemplate),
      welcomeEmail: jest.fn().mockReturnValue(mockTemplate),
      passwordReset: jest.fn().mockReturnValue(mockTemplate),
      invoiceEmail: jest.fn().mockReturnValue(mockTemplate),
      visitorInvitation: jest.fn().mockReturnValue(mockTemplate),
      passExpiring: jest.fn().mockReturnValue(mockTemplate),
    };

    notificationRepo = {
      create: jest.fn((dto) => ({ ...dto })),
      save: jest.fn((entity) =>
        Promise.resolve({ ...entity, id: 'notif-001' }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailsService,
        { provide: SendGridProvider, useValue: sendGridProvider },
        { provide: EmailTemplatesService, useValue: templateService },
        {
          provide: getRepositoryToken(Notification),
          useValue: notificationRepo,
        },
      ],
    }).compile();

    service = module.get<EmailsService>(EmailsService);
  });

  // =========================================================================
  // sendEmail
  // =========================================================================

  describe('sendEmail', () => {
    it('should send an email via SendGrid', async () => {
      const message = {
        to: [mockRecipient],
        subject: 'Test',
        html: '<p>Hello</p>',
        tags: ['test'],
      };

      const result = await service.sendEmail(message);

      expect(sendGridProvider.send).toHaveBeenCalledWith(message);
      expect(result).toEqual(mockDeliveryResult);
    });
  });

  // =========================================================================
  // sendTemplatedEmail
  // =========================================================================

  describe('sendTemplatedEmail', () => {
    it('should call the correct template method and send email', async () => {
      await service.sendTemplatedEmail(
        'bookingConfirmation',
        mockRecipient,
        { userName: 'John', resourceName: 'Room A' },
        'en',
      );

      expect(templateService.bookingConfirmation).toHaveBeenCalledWith(
        { userName: 'John', resourceName: 'Room A' },
        'en',
      );
      expect(sendGridProvider.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: [mockRecipient],
          subject: 'Test Subject',
          html: '<h1>Test Email</h1>',
          tags: ['bookingConfirmation'],
        }),
      );
    });

    it('should throw Error for unknown template type', async () => {
      await expect(
        service.sendTemplatedEmail(
          'unknownTemplate',
          mockRecipient,
          {},
          'en',
        ),
      ).rejects.toThrow('Unknown email template type: unknownTemplate');
    });
  });

  // =========================================================================
  // sendBookingConfirmation
  // =========================================================================

  describe('sendBookingConfirmation', () => {
    const bookingData = {
      userName: 'John Doe',
      resourceName: 'Meeting Room A',
      locationName: 'D Block Stamba',
      date: '2025-06-15',
      startTime: '10:00',
      endTime: '12:00',
      totalAmount: 100,
      currency: 'GEL',
    };

    it('should send booking confirmation email', async () => {
      await service.sendBookingConfirmation(mockRecipient, bookingData);

      expect(templateService.bookingConfirmation).toHaveBeenCalledWith(
        bookingData,
        'en',
      );
      expect(sendGridProvider.send).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: ['booking_confirmation'],
        }),
      );
    });

    it('should create notification record when userId is provided', async () => {
      await service.sendBookingConfirmation(
        mockRecipient,
        bookingData,
        'en',
        mockUserId,
      );

      expect(notificationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          type: NotificationType.BOOKING_CONFIRMATION,
          channel: NotificationChannel.EMAIL,
        }),
      );
      expect(notificationRepo.save).toHaveBeenCalled();
    });

    it('should NOT create notification record when userId is not provided', async () => {
      await service.sendBookingConfirmation(mockRecipient, bookingData);

      expect(notificationRepo.create).not.toHaveBeenCalled();
    });

    it('should use the language parameter', async () => {
      await service.sendBookingConfirmation(
        mockRecipient,
        bookingData,
        'ka',
      );

      expect(templateService.bookingConfirmation).toHaveBeenCalledWith(
        bookingData,
        'ka',
      );
    });
  });

  // =========================================================================
  // sendBookingReminder
  // =========================================================================

  describe('sendBookingReminder', () => {
    it('should send booking reminder email', async () => {
      await service.sendBookingReminder(mockRecipient, {
        userName: 'John',
        resourceName: 'Room A',
        locationName: 'Stamba',
        date: '2025-06-15',
        startTime: '10:00',
        endTime: '12:00',
      });

      expect(templateService.bookingReminder).toHaveBeenCalled();
      expect(sendGridProvider.send).toHaveBeenCalledWith(
        expect.objectContaining({ tags: ['booking_reminder'] }),
      );
    });
  });

  // =========================================================================
  // sendBookingCancellation
  // =========================================================================

  describe('sendBookingCancellation', () => {
    it('should send booking cancellation email', async () => {
      await service.sendBookingCancellation(mockRecipient, {
        userName: 'John',
        resourceName: 'Room A',
        locationName: 'Stamba',
        date: '2025-06-15',
        reason: 'Schedule change',
      });

      expect(templateService.bookingCancellation).toHaveBeenCalled();
      expect(sendGridProvider.send).toHaveBeenCalledWith(
        expect.objectContaining({ tags: ['booking_cancellation'] }),
      );
    });
  });

  // =========================================================================
  // sendPaymentReceipt
  // =========================================================================

  describe('sendPaymentReceipt', () => {
    it('should send payment receipt email', async () => {
      await service.sendPaymentReceipt(mockRecipient, {
        userName: 'John',
        amount: 100,
        currency: 'GEL',
        paymentMethod: 'card',
        date: '2025-06-15',
      });

      expect(templateService.paymentReceipt).toHaveBeenCalled();
      expect(sendGridProvider.send).toHaveBeenCalledWith(
        expect.objectContaining({ tags: ['payment_receipt'] }),
      );
    });
  });

  // =========================================================================
  // sendWelcomeEmail
  // =========================================================================

  describe('sendWelcomeEmail', () => {
    it('should send welcome email', async () => {
      await service.sendWelcomeEmail(mockRecipient, {
        userName: 'John Doe',
        verificationUrl: 'https://dblock.ge/verify?token=abc',
      });

      expect(templateService.welcomeEmail).toHaveBeenCalled();
      expect(sendGridProvider.send).toHaveBeenCalledWith(
        expect.objectContaining({ tags: ['welcome'] }),
      );
    });

    it('should create notification with SYSTEM_ANNOUNCEMENT type', async () => {
      await service.sendWelcomeEmail(
        mockRecipient,
        { userName: 'John Doe' },
        'en',
        mockUserId,
      );

      expect(notificationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
        }),
      );
    });
  });

  // =========================================================================
  // sendPasswordReset
  // =========================================================================

  describe('sendPasswordReset', () => {
    it('should send password reset email without notification record', async () => {
      await service.sendPasswordReset(mockRecipient, {
        userName: 'John',
        resetUrl: 'https://dblock.ge/reset?token=xyz',
        expiresIn: '1 hour',
      });

      expect(templateService.passwordReset).toHaveBeenCalled();
      expect(sendGridProvider.send).toHaveBeenCalledWith(
        expect.objectContaining({ tags: ['password_reset'] }),
      );
      // No notification record for password reset
      expect(notificationRepo.create).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // sendInvoiceEmail
  // =========================================================================

  describe('sendInvoiceEmail', () => {
    it('should send invoice email', async () => {
      await service.sendInvoiceEmail(mockRecipient, {
        userName: 'John',
        companyName: 'TechCo',
        invoiceNumber: 'INV-20250615-ABC1',
        amount: 5000,
        currency: 'GEL',
        dueDate: '2025-07-01',
      });

      expect(templateService.invoiceEmail).toHaveBeenCalled();
      expect(sendGridProvider.send).toHaveBeenCalledWith(
        expect.objectContaining({ tags: ['invoice'] }),
      );
    });
  });

  // =========================================================================
  // sendVisitorInvitation
  // =========================================================================

  describe('sendVisitorInvitation', () => {
    it('should send visitor invitation email', async () => {
      await service.sendVisitorInvitation(mockRecipient, {
        visitorName: 'Jane Smith',
        hostName: 'John Doe',
        locationName: 'D Block Stamba',
        locationAddress: '14 Merab Kostava St, Tbilisi',
        date: '2025-06-15',
        time: '14:00',
        purpose: 'Business meeting',
      });

      expect(templateService.visitorInvitation).toHaveBeenCalled();
      expect(sendGridProvider.send).toHaveBeenCalledWith(
        expect.objectContaining({ tags: ['visitor_invitation'] }),
      );
    });

    it('should create VISITOR_ARRIVING notification when userId provided', async () => {
      await service.sendVisitorInvitation(
        mockRecipient,
        {
          visitorName: 'Jane',
          hostName: 'John',
          locationName: 'Stamba',
          locationAddress: 'Tbilisi',
          date: '2025-06-15',
        },
        'en',
        mockUserId,
      );

      expect(notificationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.VISITOR_ARRIVING,
        }),
      );
    });
  });

  // =========================================================================
  // sendPassExpiringNotice
  // =========================================================================

  describe('sendPassExpiringNotice', () => {
    it('should send pass expiring notice', async () => {
      await service.sendPassExpiringNotice(mockRecipient, {
        userName: 'John',
        passType: 'Monthly Coworking',
        expirationDate: '2025-06-30',
        renewUrl: 'https://dblock.ge/renew',
      });

      expect(templateService.passExpiring).toHaveBeenCalled();
      expect(sendGridProvider.send).toHaveBeenCalledWith(
        expect.objectContaining({ tags: ['pass_expiring'] }),
      );
    });

    it('should create PASS_EXPIRING notification when userId provided', async () => {
      await service.sendPassExpiringNotice(
        mockRecipient,
        {
          userName: 'John',
          passType: 'Monthly',
          expirationDate: '2025-06-30',
        },
        'en',
        mockUserId,
      );

      expect(notificationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.PASS_EXPIRING,
        }),
      );
    });
  });

  // =========================================================================
  // Error handling
  // =========================================================================

  describe('error handling', () => {
    it('should handle notification creation failure gracefully', async () => {
      notificationRepo.save.mockRejectedValueOnce(
        new Error('DB connection lost'),
      );

      // Should not throw even if notification save fails
      await expect(
        service.sendBookingConfirmation(
          mockRecipient,
          {
            userName: 'John',
            resourceName: 'Room A',
            locationName: 'Stamba',
            date: '2025-06-15',
            startTime: '10:00',
            endTime: '12:00',
          },
          'en',
          mockUserId,
        ),
      ).resolves.not.toThrow();

      // Email should still be sent
      expect(sendGridProvider.send).toHaveBeenCalled();
    });
  });
});
