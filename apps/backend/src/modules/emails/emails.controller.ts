import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { IsString, IsArray, IsEmail, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/common/database/entities/user.entity';
import { EmailsService } from './emails.service';
import { EmailTemplatesService } from './email-templates.service';

class SendEmailRecipientDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;
}

class SendEmailDto {
  @ApiProperty({ type: [SendEmailRecipientDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SendEmailRecipientDto)
  to: SendEmailRecipientDto[];

  @ApiProperty({ example: 'Test Email Subject' })
  @IsString()
  subject: string;

  @ApiProperty({ example: '<h1>Hello</h1><p>This is a test email.</p>' })
  @IsString()
  html: string;
}

@ApiTags('Emails')
@ApiBearerAuth()
@Controller('emails')
export class EmailsController {
  constructor(
    private readonly emailsService: EmailsService,
    private readonly templateService: EmailTemplatesService,
  ) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING_ADMIN)
  @ApiOperation({ summary: 'Send an arbitrary email (admin only)' })
  @ApiBody({ type: SendEmailDto })
  async sendEmail(@Body() dto: SendEmailDto) {
    const result = await this.emailsService.sendEmail({
      to: dto.to,
      subject: dto.subject,
      html: dto.html,
    });
    return { success: true, result };
  }

  @Post('test/:template')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Send a test email for a specific template (super admin only)' })
  @ApiParam({ name: 'template', description: 'Template name (e.g. bookingConfirmation)' })
  async sendTestEmail(@Param('template') template: string) {
    const mockData = this.getMockDataForTemplate(template);

    if (!mockData) {
      return { success: false, message: `Unknown template: ${template}` };
    }

    const result = await this.emailsService.sendTemplatedEmail(
      template,
      { email: 'test@dblock.com', name: 'Test User' },
      mockData,
      'en',
    );

    return { success: true, template, result };
  }

  @Get('templates')
  @Roles(UserRole.SUPER_ADMIN, UserRole.MARKETING_ADMIN)
  @ApiOperation({ summary: 'List all available email template names' })
  async listTemplates() {
    return {
      templates: this.templateService.getAvailableTemplates(),
    };
  }

  private getMockDataForTemplate(template: string): Record<string, any> | null {
    const mockDataMap: Record<string, Record<string, any>> = {
      bookingConfirmation: {
        userName: 'Test User',
        resourceName: 'Meeting Room A',
        locationName: 'D Block Vake',
        date: '2025-03-15',
        startTime: '10:00',
        endTime: '12:00',
        totalAmount: 50,
        currency: 'GEL',
      },
      bookingReminder: {
        userName: 'Test User',
        resourceName: 'Hot Desk #5',
        locationName: 'D Block Vake',
        date: '2025-03-15',
        startTime: '09:00',
        endTime: '18:00',
      },
      bookingCancellation: {
        userName: 'Test User',
        resourceName: 'Private Office 3',
        locationName: 'D Block Saburtalo',
        date: '2025-03-15',
        reason: 'Schedule conflict',
      },
      paymentReceipt: {
        userName: 'Test User',
        amount: 150,
        currency: 'GEL',
        paymentMethod: 'Visa **** 4242',
        invoiceNumber: 'INV-2025-001',
        date: '2025-03-15',
      },
      welcomeEmail: {
        userName: 'Test User',
        verificationUrl: 'https://app.dblock.com/verify?token=test123',
      },
      passwordReset: {
        userName: 'Test User',
        resetUrl: 'https://app.dblock.com/reset?token=test456',
        expiresIn: '1 hour',
      },
      invoiceEmail: {
        userName: 'Test User',
        companyName: 'Acme Corp',
        invoiceNumber: 'INV-2025-002',
        amount: 500,
        currency: 'GEL',
        dueDate: '2025-04-01',
      },
      visitorInvitation: {
        visitorName: 'Jane Smith',
        hostName: 'Test User',
        locationName: 'D Block Vake',
        locationAddress: '12 Chavchavadze Ave, Tbilisi',
        date: '2025-03-20',
        time: '14:00',
        purpose: 'Business meeting',
      },
      passExpiring: {
        userName: 'Test User',
        passType: 'Monthly',
        expirationDate: '2025-03-31',
        renewUrl: 'https://app.dblock.com/passes/renew',
      },
      contractRenewal: {
        companyName: 'Acme Corp',
        contractNumber: 'CTR-2025-001',
        currentEndDate: '2025-06-30',
        newEndDate: '2026-06-30',
      },
    };

    return mockDataMap[template] || null;
  }
}
