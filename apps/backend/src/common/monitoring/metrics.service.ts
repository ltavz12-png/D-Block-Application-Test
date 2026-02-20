import { Injectable, Logger } from '@nestjs/common';

/**
 * Label set for metric data points.
 */
export type MetricLabels = Record<string, string>;

interface CounterEntry {
  value: number;
  labels: MetricLabels;
}

interface GaugeEntry {
  value: number;
  labels: MetricLabels;
}

interface HistogramEntry {
  values: number[];
  labels: MetricLabels;
}

/**
 * In-memory metrics service that collects counters, gauges, and histograms,
 * then exposes them in Prometheus text exposition format via getMetrics().
 *
 * Designed to be lightweight enough for Azure App Service environments
 * where a full Prometheus client may not be desired.
 */
@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);

  // ------------------------------------------------------------------
  // Storage
  // ------------------------------------------------------------------
  private readonly counters = new Map<string, CounterEntry[]>();
  private readonly gauges = new Map<string, GaugeEntry[]>();
  private readonly histograms = new Map<string, HistogramEntry[]>();

  // Pre-defined metric names for type-safe usage throughout the app
  // ------------------------------------------------------------------
  // HTTP
  static readonly HTTP_REQUEST_COUNT = 'http_requests_total';
  static readonly HTTP_REQUEST_DURATION_MS = 'http_request_duration_ms';
  static readonly HTTP_ERROR_COUNT = 'http_errors_total';

  // WebSocket
  static readonly WS_ACTIVE_CONNECTIONS = 'ws_active_connections';

  // Bookings
  static readonly BOOKING_CREATED = 'booking_created_total';
  static readonly BOOKING_CANCELLED = 'booking_cancelled_total';
  static readonly BOOKING_COMPLETED = 'booking_completed_total';

  // Payments
  static readonly PAYMENT_SUCCESSFUL = 'payment_successful_total';
  static readonly PAYMENT_FAILED = 'payment_failed_total';
  static readonly PAYMENT_REFUNDED = 'payment_refunded_total';

  // Auth
  static readonly AUTH_LOGIN = 'auth_login_total';
  static readonly AUTH_REGISTER = 'auth_register_total';
  static readonly AUTH_FAILED = 'auth_failed_attempts_total';

  // SaltoKS access control
  static readonly SALTO_KEY_GRANT = 'salto_key_grant_total';
  static readonly SALTO_KEY_REVOCATION = 'salto_key_revocation_total';
  static readonly SALTO_BLE_UNLOCK = 'salto_ble_unlock_total';

  // ------------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------------

  /**
   * Increment a counter metric by 1 (or by a specified amount).
   */
  increment(metric: string, labels: MetricLabels = {}, amount = 1): void {
    const entries = this.counters.get(metric) || [];
    const existing = entries.find((e) => this.labelsMatch(e.labels, labels));

    if (existing) {
      existing.value += amount;
    } else {
      entries.push({ value: amount, labels: { ...labels } });
    }

    this.counters.set(metric, entries);
  }

  /**
   * Set a gauge metric to a specific value.
   */
  gauge(metric: string, value: number, labels: MetricLabels = {}): void {
    const entries = this.gauges.get(metric) || [];
    const existing = entries.find((e) => this.labelsMatch(e.labels, labels));

    if (existing) {
      existing.value = value;
    } else {
      entries.push({ value, labels: { ...labels } });
    }

    this.gauges.set(metric, entries);
  }

  /**
   * Record an observation for a histogram metric.
   */
  histogram(metric: string, value: number, labels: MetricLabels = {}): void {
    const entries = this.histograms.get(metric) || [];
    const existing = entries.find((e) => this.labelsMatch(e.labels, labels));

    if (existing) {
      existing.values.push(value);
    } else {
      entries.push({ values: [value], labels: { ...labels } });
    }

    this.histograms.set(metric, entries);
  }

  // ------------------------------------------------------------------
  // Prometheus exposition
  // ------------------------------------------------------------------

  /**
   * Return all collected metrics in Prometheus text exposition format.
   */
  getMetrics(): string {
    const lines: string[] = [];

    // Counters
    for (const [name, entries] of this.counters) {
      lines.push(`# HELP ${name} Counter metric`);
      lines.push(`# TYPE ${name} counter`);
      for (const entry of entries) {
        lines.push(`${name}${this.formatLabels(entry.labels)} ${entry.value}`);
      }
    }

    // Gauges
    for (const [name, entries] of this.gauges) {
      lines.push(`# HELP ${name} Gauge metric`);
      lines.push(`# TYPE ${name} gauge`);
      for (const entry of entries) {
        lines.push(`${name}${this.formatLabels(entry.labels)} ${entry.value}`);
      }
    }

    // Histograms – emit _count, _sum, and quantile approximations
    for (const [name, entries] of this.histograms) {
      lines.push(`# HELP ${name} Histogram metric`);
      lines.push(`# TYPE ${name} histogram`);
      for (const entry of entries) {
        const sorted = [...entry.values].sort((a, b) => a - b);
        const count = sorted.length;
        const sum = sorted.reduce((acc, v) => acc + v, 0);
        const labelStr = this.formatLabels(entry.labels);

        // Buckets (common latency buckets in ms)
        const buckets = [50, 100, 250, 500, 1000, 2500, 5000, 10000];
        for (const le of buckets) {
          const bucketCount = sorted.filter((v) => v <= le).length;
          const bucketLabels = this.formatLabels({
            ...entry.labels,
            le: String(le),
          });
          lines.push(`${name}_bucket${bucketLabels} ${bucketCount}`);
        }
        const infLabels = this.formatLabels({
          ...entry.labels,
          le: '+Inf',
        });
        lines.push(`${name}_bucket${infLabels} ${count}`);
        lines.push(`${name}_sum${labelStr} ${sum}`);
        lines.push(`${name}_count${labelStr} ${count}`);
      }
    }

    return lines.join('\n');
  }

  // ------------------------------------------------------------------
  // Flush / reset
  // ------------------------------------------------------------------

  /**
   * Flush all accumulated metrics — useful for periodic scrape-and-reset
   * workflows or testing.
   */
  flush(): void {
    this.logger.log('Flushing all in-memory metrics');
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  private labelsMatch(a: MetricLabels, b: MetricLabels): boolean {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) => a[key] === b[key]);
  }

  private formatLabels(labels: MetricLabels): string {
    const keys = Object.keys(labels);
    if (keys.length === 0) return '';

    const pairs = keys.map(
      (key) => `${key}="${this.escapeLabel(labels[key])}"`,
    );
    return `{${pairs.join(',')}}`;
  }

  private escapeLabel(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n');
  }
}
