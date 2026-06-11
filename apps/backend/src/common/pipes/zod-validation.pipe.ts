import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { ZodSchema } from 'zod';
import { MESSAGES } from '../constants/messages';

/**
 * Validates a request part against a Zod schema.
 * Usage: `@Body(new ZodValidationPipe(createTaskSchema)) dto: CreateTaskInput`
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: MESSAGES.VALIDATION.FAILED,
        details: result.error.issues.map((issue) => ({
          field: issue.path.join('.') || '(root)',
          message: issue.message,
        })),
      });
    }
    return result.data;
  }
}
