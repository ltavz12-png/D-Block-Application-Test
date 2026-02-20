import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationType,
  NotificationChannel,
} from '@/common/database/entities/notification.entity';
import { SendGridProvider } from './providers/sendgrid.provider';
import { EmailTemplatesService } from './email-templates.service';
import {
  EmailMessage,
  EmailRecipient,
  EmailDeliveryResult,
} from './providers/email-provider.interface';

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);

  constructor(
    private readonly sendGridProvider: SendGridProvider,
    private readonly templateService: EmailTemplatesService,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async sendEmail(message: EmailMessage): Promise<EmailDeliveryResult> {
    this.logger.log(`Sending email to ${message.to.map((r) => r.email).join(', ')}`);
    return this.sendGridProvider.send(message);
  }

  async sendTemplatedEmail(
    type: string,
    to: EmailRecipient,
    data: Record<string, any>,
    language = 'en',
  ): Promise<EmailDeliveryResult> {
    const templateMethod = (this.templateService as any)[type];
    if (typeof templateMethod !== 'function') {
      throw new Error(`Unknown email template type: ${type}`);
    }

    const template = templateMethod.call(this.templateService, data, language);

    const message: EmailMessage = {
      to: [to],
      subject: template.subject,
      html: template.html,
      tags: [type],
    };

    return this.sendEmail(message);
  }

  async sendBookingConfirmation(
    to: EmailRecipient,
    data: {
      userName: string;
      resourceName: string;
      locationName: string;
      date: string;
      startTime: string;
      endTime: string;
      totalAmount?: number;
      currency?: string;
    },
    lang = 'en',
    userId?: string,
  ): Promise<void> {
    const template = this.templateService.bookingConfirmation(data, lang);

    if (userId) {
      await this.createNotificationRecord(
        userId,
        NotificationType.BOOKING_CONFIRMATION,
        template.subject,
        `Booking confirmed for ${data.resourceName} at ${data.locationName} on ${data.date}`,
        data,
        lang,
      );
    }

    await this.sendEmail({
      to: [to],
      subject: template.subject,
      html: template.html,
      tags: ['booking_confirmation'],
    });
  }

  async sendBookingReminder(
    to: EmailRecipient,
    data: {
      userName: string;
      resourceName: string;
      locationName: string;
      date: string;
      startTime: string;
      endTime: string;
    },
    lang = 'en',
    userId?: string,
  ): Promise<void> {
    const template = this.templateService.bookingReminder(data, lang);

    if (userId) {
      await this.createNotificationRecord(
        userId,
        NotificationType.BOOKING_REMINDER,
        template.subject,
        `Reminder: Booking for ${data.resourceName} on ${data.date} at ${data.startTime}`,
        data,
        lang,
      );
    }

    await this.sendEmail({
      to: [to],
      subject: template.subject,
      html: template.html,
      tags: ['booking_reminder'],
    });
  }

  async sendBookingCancellation(
    to: EmailRecipient,
    data: {
      userName: string;
      resourceName: string;
      locationName: string;
      date: string;
      reason?: string;
    },
    lang = 'en',
    userId?: string,
  ): Promise<void> {
    const template = this.templateService.bookingCancellation(data, lang);

    if (userId) {
      await this.createNotificationRecord(
        userId,
        NotificationType.BOOKING_CANCELLATION,
        template.subject,
        `Booking cancelled for ${data.resourceName} at ${data.locationName} on ${data.date}`,
        data,
        lang,
      );
    }

    await this.sendEmail({
      to: [to],
      subject: template.subject,
      html: template.html,
      tags: ['booking_cancellation'],
    });
  }

  async sendPaymentReceipt(
    to: EmailRecipient,
    data: {
      userName: string;
      amount: number;
      currency: string;
      paymentMethod: string;
      invoiceNumber?: string;
      date: string;
    },
    lang = 'en',
    userId?: string,
  ): Promise<void> {
    const template = this.templateService.paymentReceipt(data, lang);

    if (userId) {
      await this.createNotificationRecord(
        userId,
        NotificationType.PAYMENT_RECEIPT,
        template.subject,
        `Payment of ${data.amount} ${data.currency} received`,
        data,
        lang,
      );
    }

    await this.sendEmail({
      to: [to],
      subject: template.subject,
      html: template.html,
      tags: ['payment_receipt'],
    });
  }

  async sendWelcomeEmail(
    to: EmailRecipient,
    data: {
      userName: string;
      verificationUrl?: string;
    },
    lang = 'en',
    userId?: string,
  ): Promise<void> {
    const template = this.templateService.welcomeEmail(data, lang);

    if (userId) {
      await this.createNotificationRecord(
        userId,
        NotificationType.SYSTEM_ANNOUNCEMENT,
        template.subject,
        `Welcome to D Block Workspace, ${data.userName}!`,
        data,
        lang,
      );
    }

    await this.sendEmail({
      to: [to],
      subject: template.subject,
      html: template.html,
      tags: ['welcome'],
    });
  }

  async sendPasswordReset(
    to: EmailRecipient,
    data: {
      userName: string;
      resetUrl: string;
      expiresIn?: string;
    },
    lang = 'en',
  ): Promise<void> {
    const template = this.templateService.passwordReset(data, lang);

    await this.sendEmail({
      to: [to],
      subject: template.subject,
      html: template.html,
      tags: ['password_reset'],
    });
  }

  async sendInvoiceEmail(
    to: EmailRecipient,
    data: {
      userName: string;
      companyName?: string;
      invoiceNumber: string;
      amount: number;
      currency: string;
      dueDate: string;
    },
    lang = 'en',
    userId?: string,
  ): Promise<void> {
    const template = this.templateService.invoiceEmail(data, lang);

    if (userId) {
      await this.createNotificationRecord(
        userId,
        NotificationType.PAYMENT_RECEIPT,
        template.subject,
        `Invoice ${data.invoiceNumber} for ${data.amount} ${data.currency} due ${data.dueDate}`,
        data,
        lang,
      );
    }

    await this.sendEmail({
      to: [to],
      subject: template.subject,
      html: template.html,
      tags: ['invoice'],
    });
  }

  async sendVisitorInvitation(
    to: EmailRecipient,
    data: {
      visitorName: string;
      hostName: string;
      locationName: string;
      locationAddress: string;
      date: string;
      time?: string;
      purpose?: string;
    },
    lang = 'en',
    userId?: string,
  ): Promise<void> {
    const template = this.templateService.visitorInvitation(data, lang);

    if (userId) {
      await this.createNotificationRecord(
        userId,
        NotificationType.VISITOR_ARRIVING,
        template.subject,
        `Visitor ${data.visitorName} invited on ${data.date}`,
        data,
        lang,
      );
    }

    await this.sendEmail({
      to: [to],
      subject: template.subject,
      html: template.html,
      tags: ['visitor_invitation'],
    });
  }

  async sendPassExpiringNotice(
    to: EmailRecipient,
    data: {
      userName: string;
      passType: string;
      expirationDate: string;
      renewUrl?: string;
    },
    lang = 'en',
    userId?: string,
  ): Promise<void> {
    const template = this.templateService.passExpiring(data, lang);

    if (userId) {
      await this.createNotificationRecord(
        userId,
        NotificationType.PASS_EXPIRING,
        template.subject,
        `Your ${data.passType} pass expires on ${data.expirationDate}`,
        data,
        lang,
      );
    }

    await this.sendEmail({
      to: [to],
      subject: template.subject,
      html: template.html,
      tags: ['pass_expiring'],
    });
  }

  private async createNotificationRecord(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data: Record<string, any>,
    language: string,
  ): Promise<Notification> {
    try {
      const notification = this.notificationRepo.create({
        userId,
        type,
        channel: NotificationChannel.EMAIL,
        title,
        body,
        data,
        sentAt: new Date(),
        deliveryStatus: 'sent',
        language,
      });
      return await this.notificationRepo.save(notification);
    } catch (error) {
      this.logger.error(
        `Failed to create notification record: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null as any;
    }
  }
}
