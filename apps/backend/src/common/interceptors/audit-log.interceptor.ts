import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../database/entities/audit-log.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepo: Repository<AuditLog>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user } = request;

    // Only audit write operations
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return next.handle();
    }

    const correlationId = request.headers['x-correlation-id'] || uuidv4();
    request.correlationId = correlationId;

    return next.handle().pipe(
      tap(async (responseData) => {
        try {
          const entityType = this.extractEntityType(url);
          const entityId = this.extractEntityId(url, responseData);

          if (entityType) {
            await this.auditLogRepo.save({
              entityType,
              entityId: entityId || '00000000-0000-0000-0000-000000000000',
              action: this.mapMethodToAction(method),
              actorId: user?.id || null,
              actorRole: user?.role || null,
              newValues: method === 'DELETE' ? null : body,
              ipAddress: request.ip || request.connection?.remoteAddress,
              userAgent: request.headers['user-agent'] || null,
              correlationId,
            });
          }
        } catch (err) {
          // Audit logging should never break the request
          console.error('Audit log failed:', err);
        }
      }),
    );
  }

  private extractEntityType(url: string): string | null {
    const match = url.match(/\/api\/v1\/([^/?]+)/);
    return match ? match[1] : null;
  }

  private extractEntityId(url: string, responseData: any): string | null {
    // Try to get from URL params
    const uuidMatch = url.match(
      /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i,
    );
    if (uuidMatch) return uuidMatch[1];

    // Try to get from response
    if (responseData?.id) return responseData.id;
    if (responseData?.data?.id) return responseData.data.id;

    return null;
  }

  private mapMethodToAction(method: string): string {
    const map: Record<string, string> = {
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete',
    };
    return map[method] || method.toLowerCase();
  }
}
