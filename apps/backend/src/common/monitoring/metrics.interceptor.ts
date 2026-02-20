import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';
import { MetricsService } from './metrics.service';

/**
 * Global HTTP interceptor that records per-request metrics using
 * the MetricsService.
 *
 * Tracked metrics:
 *  - http_requests_total    (counter)  – by method, path, status
 *  - http_request_duration_ms (histogram) – by method, path, status
 *  - http_errors_total      (counter)  – by method, path, error type
 *
 * Requests that exceed SLOW_REQUEST_THRESHOLD_MS are logged as warnings
 * so they appear in Application Insights traces.
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MetricsInterceptor.name);

  /** Any request taking longer than this is logged as a warning. */
  private static readonly SLOW_REQUEST_THRESHOLD_MS = 1000;

  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Only track HTTP requests
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const { method } = request;
    const path = this.normalizePath(request.route?.path || request.path);
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse<Response>();
          const duration = Date.now() - startTime;
          const statusCode = String(response.statusCode);

          this.recordMetrics(method, path, statusCode, duration);
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = String(
            error?.status || error?.getStatus?.() || 500,
          );
          const errorType = error?.constructor?.name || 'UnknownError';

          this.recordMetrics(method, path, statusCode, duration);

          this.metricsService.increment(MetricsService.HTTP_ERROR_COUNT, {
            method,
            path,
            error_type: errorType,
          });
        },
      }),
    );
  }

  // ------------------------------------------------------------------
  // Internal helpers
  // ------------------------------------------------------------------

  private recordMetrics(
    method: string,
    path: string,
    statusCode: string,
    duration: number,
  ): void {
    const labels = { method, path, status: statusCode };

    this.metricsService.increment(MetricsService.HTTP_REQUEST_COUNT, labels);
    this.metricsService.histogram(
      MetricsService.HTTP_REQUEST_DURATION_MS,
      duration,
      labels,
    );

    if (duration > MetricsInterceptor.SLOW_REQUEST_THRESHOLD_MS) {
      this.logger.warn(
        `Slow request: ${method} ${path} responded ${statusCode} in ${duration}ms`,
      );
    }
  }

  /**
   * Collapse path parameters into placeholders so that metrics are
   * grouped sensibly (e.g. /api/v1/bookings/:id instead of per-UUID).
   */
  private normalizePath(rawPath: string): string {
    if (!rawPath) return 'unknown';

    // Express route path already has :param placeholders — prefer that.
    // Fallback: replace UUIDs and numeric IDs with :id.
    return rawPath
      .replace(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
        ':id',
      )
      .replace(/\/\d+(?=\/|$)/g, '/:id');
  }
}
