import * as Sentry from '@sentry/node';

// ------------------------------------------------------------------
// Errors that should be silently dropped (expected operational errors)
// ------------------------------------------------------------------
const IGNORED_ERROR_NAMES = [
  'NotFoundException',
  'UnauthorizedException',
  'ForbiddenException',
  'BadRequestException',
  'ThrottlerException',
];

// ------------------------------------------------------------------
// Sensitive field patterns used by the beforeSend scrubber
// ------------------------------------------------------------------
const SENSITIVE_KEYS =
  /password|passwd|secret|token|authorization|cookie|credit.?card|card.?number|cvv|cvc|ssn/i;

const CARD_NUMBER_PATTERN = /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{1,4}\b/g;

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

/**
 * Recursively scrub sensitive values from an object so they are never
 * transmitted to Sentry.
 */
function scrubSensitiveData(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return obj.replace(CARD_NUMBER_PATTERN, '[REDACTED_CARD]');
  }

  if (Array.isArray(obj)) {
    return obj.map(scrubSensitiveData);
  }

  if (typeof obj === 'object') {
    const scrubbed: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.test(key)) {
        scrubbed[key] = '[REDACTED]';
      } else {
        scrubbed[key] = scrubSensitiveData(value);
      }
    }
    return scrubbed;
  }

  return obj;
}

/**
 * Determine the transaction sample rate based on the current environment.
 */
function getTracesSampleRate(): number {
  const env = process.env.NODE_ENV || 'development';
  if (env === 'production') return 0.01;
  if (env === 'staging') return 0.1;
  return 1.0; // development / test
}

// ------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------

/**
 * Initialize Sentry for the NestJS backend.
 *
 * Call this as early as possible in your bootstrap function, *before*
 * the NestJS application is created:
 *
 * ```ts
 * import { initSentry } from './common/monitoring/sentry.config';
 * initSentry();
 * const app = await NestFactory.create(AppModule);
 * ```
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    // Sentry is optional — skip silently in dev when no DSN is set.
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.npm_package_version
      ? `dblock-workspace@${process.env.npm_package_version}`
      : undefined,

    // Error events — always capture 100 %
    sampleRate: 1.0,

    // Performance / transaction sampling
    tracesSampleRate: getTracesSampleRate(),

    ignoreErrors: IGNORED_ERROR_NAMES,

    beforeSend(event: Sentry.ErrorEvent): Sentry.ErrorEvent | null {
      // Scrub request body
      if (event.request?.data) {
        event.request.data = scrubSensitiveData(
          event.request.data,
        ) as string;
      }

      // Scrub request headers
      if (event.request?.headers) {
        event.request.headers = scrubSensitiveData(
          event.request.headers,
        ) as Record<string, string>;
      }

      // Scrub breadcrumb data
      if (event.breadcrumbs) {
        for (const breadcrumb of event.breadcrumbs) {
          if (breadcrumb.data) {
            breadcrumb.data = scrubSensitiveData(breadcrumb.data) as Record<
              string,
              unknown
            >;
          }
        }
      }

      // Scrub extra context
      if (event.extra) {
        event.extra = scrubSensitiveData(event.extra) as Record<
          string,
          unknown
        >;
      }

      return event;
    },
  });
}

/**
 * Capture an exception manually.
 *
 * ```ts
 * import { captureException } from './common/monitoring/sentry.config';
 * captureException(error, { tags: { module: 'payments' } });
 * ```
 */
export function captureException(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (context) {
    Sentry.withScope((scope) => {
      if (context.tags) {
        for (const [key, value] of Object.entries(
          context.tags as Record<string, string>,
        )) {
          scope.setTag(key, value);
        }
      }
      if (context.extra) {
        for (const [key, value] of Object.entries(
          context.extra as Record<string, unknown>,
        )) {
          scope.setExtra(key, value);
        }
      }
      if (context.user) {
        scope.setUser(context.user as Sentry.User);
      }
      Sentry.captureException(error);
    });
  } else {
    Sentry.captureException(error);
  }
}

/**
 * Set the current user context for Sentry events.
 */
export function setUser(user: { id: string; email?: string } | null): void {
  Sentry.setUser(user);
}

/**
 * Flush pending Sentry events (call before process exit).
 */
export async function flushSentry(timeout = 2000): Promise<boolean> {
  return Sentry.flush(timeout);
}
