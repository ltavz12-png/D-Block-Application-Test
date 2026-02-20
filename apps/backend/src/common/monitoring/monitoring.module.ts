import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MetricsService } from './metrics.service';
import { MetricsInterceptor } from './metrics.interceptor';
import { HealthController } from './health.controller';

/**
 * Global monitoring module.
 *
 * Provides:
 *  - MetricsService      – injectable throughout the application for
 *                          recording counters, gauges, and histograms.
 *  - MetricsInterceptor  – automatically tracks HTTP request count,
 *                          duration, and errors on every route.
 *  - HealthController    – /health, /health/ready, /health/live endpoints
 *                          used by Azure App Service health probes.
 */
@Global()
@Module({
  controllers: [HealthController],
  providers: [
    MetricsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
  exports: [MetricsService],
})
export class MonitoringModule {}
