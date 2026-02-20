import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from '@/common/database/entities/notification.entity';
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';
import { EmailTemplatesService } from './email-templates.service';
import { MockEmailProvider } from './providers/mock-email.provider';
import { SendGridProvider } from './providers/sendgrid.provider';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [EmailsController],
  providers: [
    EmailsService,
    EmailTemplatesService,
    MockEmailProvider,
    SendGridProvider,
  ],
  exports: [EmailsService],
})
export class EmailsModule {}
