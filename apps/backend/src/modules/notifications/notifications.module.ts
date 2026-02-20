import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from '@/common/database/entities/notification.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PUSH_NOTIFICATION_PROVIDER } from './providers/push-notification.provider';
import { MockPushProvider } from './providers/mock-push.provider';
import { FcmPushProvider } from './providers/fcm-push.provider';

@Module({
  imports: [TypeOrmModule.forFeature([Notification])],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    {
      provide: PUSH_NOTIFICATION_PROVIDER,
      useFactory: () => {
        const firebaseCredentials = process.env.FIREBASE_CREDENTIALS_PATH;
        const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;

        if (firebaseCredentials || firebaseProjectId) {
          return new FcmPushProvider();
        }

        return new MockPushProvider();
      },
    },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
