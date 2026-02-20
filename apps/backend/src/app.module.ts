import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import {
  appConfig,
  databaseConfig,
  redisConfig,
  jwtConfig,
  integrationConfig,
} from './common/config/app.config';

// Module imports
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { LocationsModule } from './modules/locations/locations.module';
import { ResourcesModule } from './modules/resources/resources.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { B2bModule } from './modules/b2b/b2b.module';
import { CreditsModule } from './modules/credits/credits.module';
import { PassesModule } from './modules/passes/passes.module';
import { AccessModule } from './modules/access/access.module';
import { VisitorsModule } from './modules/visitors/visitors.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { EmailsModule } from './modules/emails/emails.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { CalendarsModule } from './modules/calendars/calendars.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SupportModule } from './modules/support/support.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AdminModule } from './modules/admin/admin.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { ProductsModule } from './modules/products/products.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { HealthModule } from './modules/health/health.module';
import { BusinessCentralModule } from './modules/integrations/business-central/business-central.module';
import { MonitoringModule } from './common/monitoring/monitoring.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, redisConfig, jwtConfig, integrationConfig],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('database.host'),
        port: config.get('database.port'),
        username: config.get('database.username'),
        password: config.get('database.password'),
        database: config.get('database.name'),
        entities: [__dirname + '/common/database/entities/*.entity{.ts,.js}'],
        synchronize: config.get('app.nodeEnv') === 'development',
        logging: config.get('app.nodeEnv') === 'development',
      }),
    }),

    // Scheduling (cron jobs for revenue recognition, etc.)
    ScheduleModule.forRoot(),

    // Global monitoring (metrics, health probes, request tracking)
    MonitoringModule,

    // Feature modules
    HealthModule,
    AuthModule,
    UsersModule,
    LocationsModule,
    ResourcesModule,
    BookingsModule,
    PaymentsModule,
    AccountingModule,
    B2bModule,
    CreditsModule,
    PassesModule,
    AccessModule,
    VisitorsModule,
    NotificationsModule,
    EmailsModule,
    PromotionsModule,
    CalendarsModule,
    ReportsModule,
    SupportModule,
    AnalyticsModule,
    AdminModule,
    ContractsModule,
    ProductsModule,
    InvoicesModule,
    BusinessCentralModule,
  ],
})
export class AppModule {}
