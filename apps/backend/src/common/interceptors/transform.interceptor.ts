import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import type { ApiSuccessResponse } from '@planforge/shared';

/** Wraps every successful response in the standard `{ success, data, timestamp }` envelope. */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiSuccessResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiSuccessResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        data: data ?? (null as T),
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
