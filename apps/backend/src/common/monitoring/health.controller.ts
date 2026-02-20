import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { Public } from '@/common/decorators/public.decorator';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: { status: string; latency_ms: number | null };
    redis: { status: string; latency_ms: number | null };
    memory: {
      rss_mb: number;
      heap_used_mb: number;
      heap_total_mb: number;
    };
  };
}

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);
  private readonly version: string;
  private readonly environment: string;
  private readonly startTime: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {
    this.version = process.env.npm_package_version || '0.1.0';
    this.environment = this.configService.get<string>('app.nodeEnv', 'development');
    this.startTime = Date.now();
  }

  @Get()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Comprehensive health check',
    description:
      'Returns detailed health status including database, redis, and memory checks. Used by Azure App Service health probes.',
  })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async check(): Promise<HealthCheckResult> {
    const [dbCheck, redisCheck] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const memoryCheck = this.checkMemory();

    const overallStatus = this.determineOverallStatus(dbCheck, redisCheck);

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: this.version,
      environment: this.environment,
      checks: {
        database: dbCheck,
        redis: redisCheck,
        memory: memoryCheck,
      },
    };

    if (overallStatus === 'unhealthy') {
      this.logger.error('Health check returned unhealthy', JSON.stringify(result));
    } else if (overallStatus === 'degraded') {
      this.logger.warn('Health check returned degraded', JSON.stringify(result));
    }

    return result;
  }

  @Get('ready')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Readiness probe',
    description:
      'Returns 200 if the service is ready to accept traffic (database and redis connected). Used by Kubernetes readiness probes and Azure health probes.',
  })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async ready(): Promise<{ status: string; checks: Record<string, string> }> {
    const [dbCheck, redisCheck] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const isReady = dbCheck.status === 'connected' && redisCheck.status === 'connected';

    if (!isReady) {
      this.logger.warn(
        `Readiness check failed: db=${dbCheck.status}, redis=${redisCheck.status}`,
      );
    }

    return {
      status: isReady ? 'ready' : 'not_ready',
      checks: {
        database: dbCheck.status,
        redis: redisCheck.status,
      },
    };
  }

  @Get('live')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Liveness probe',
    description:
      'Returns 200 if the process is alive. Used by Kubernetes liveness probes and Azure health probes.',
  })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  live(): { status: string; timestamp: string } {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDatabase(): Promise<{
    status: string;
    latency_ms: number | null;
  }> {
    const start = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
      return {
        status: 'connected',
        latency_ms: Date.now() - start,
      };
    } catch (error) {
      this.logger.error('Database health check failed', error?.message || error);
      return {
        status: 'disconnected',
        latency_ms: null,
      };
    }
  }

  private async checkRedis(): Promise<{
    status: string;
    latency_ms: number | null;
  }> {
    const start = Date.now();
    try {
      // Attempt to connect to Redis using ioredis
      // This is done inline to avoid a hard dependency on a Redis module
      const Redis = require('ioredis');
      const redisHost = this.configService.get<string>('redis.host', 'localhost');
      const redisPort = this.configService.get<number>('redis.port', 6379);
      const redisPassword = this.configService.get<string>('redis.password');

      const client = new Redis({
        host: redisHost,
        port: redisPort,
        password: redisPassword || undefined,
        connectTimeout: 3000,
        lazyConnect: true,
      });

      await client.connect();
      await client.ping();
      const latency = Date.now() - start;
      await client.quit();

      return {
        status: 'connected',
        latency_ms: latency,
      };
    } catch (error) {
      this.logger.error('Redis health check failed', error?.message || error);
      return {
        status: 'disconnected',
        latency_ms: null,
      };
    }
  }

  private checkMemory(): {
    rss_mb: number;
    heap_used_mb: number;
    heap_total_mb: number;
  } {
    const memUsage = process.memoryUsage();
    return {
      rss_mb: Math.round((memUsage.rss / 1024 / 1024) * 100) / 100,
      heap_used_mb:
        Math.round((memUsage.heapUsed / 1024 / 1024) * 100) / 100,
      heap_total_mb:
        Math.round((memUsage.heapTotal / 1024 / 1024) * 100) / 100,
    };
  }

  private determineOverallStatus(
    dbCheck: { status: string; latency_ms: number | null },
    redisCheck: { status: string; latency_ms: number | null },
  ): 'healthy' | 'degraded' | 'unhealthy' {
    // Database is critical - if it's down, service is unhealthy
    if (dbCheck.status !== 'connected') {
      return 'unhealthy';
    }

    // Redis is important but not critical for basic operation
    if (redisCheck.status !== 'connected') {
      return 'degraded';
    }

    // Check for high latency thresholds (indicating degradation)
    if (
      (dbCheck.latency_ms !== null && dbCheck.latency_ms > 1000) ||
      (redisCheck.latency_ms !== null && redisCheck.latency_ms > 500)
    ) {
      return 'degraded';
    }

    return 'healthy';
  }
}
