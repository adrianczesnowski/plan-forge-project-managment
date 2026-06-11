import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import type { ApiErrorDetail, ApiErrorResponse } from '@planforge/shared';
import { MESSAGES } from '../constants/messages';

const CODE_BY_STATUS: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_ERROR',
};

interface HttpExceptionBody {
  message?: string | string[];
  code?: string;
  details?: ApiErrorDetail[];
}

/** Formats every thrown exception into the standard `{ success: false, error }` envelope. */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, body } = this.buildError(exception);
    response.status(status).json(body);
  }

  private buildError(exception: unknown): { status: number; body: ApiErrorResponse } {
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = MESSAGES.COMMON.INTERNAL_ERROR;
    let code: string | undefined;
    let details: ApiErrorDetail[] | null = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const raw = exception.getResponse();
      if (typeof raw === 'string') {
        message = raw;
      } else {
        const body = raw as HttpExceptionBody;
        message = Array.isArray(body.message) ? body.message.join(', ') : (body.message ?? message);
        code = body.code;
        details = body.details ?? null;
      }
    } else {
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
        undefined,
        'UnhandledException',
      );
    }

    return {
      status,
      body: {
        success: false,
        error: {
          code: code ?? CODE_BY_STATUS[status] ?? 'ERROR',
          message,
          details,
        },
        timestamp: new Date().toISOString(),
      },
    };
  }
}
