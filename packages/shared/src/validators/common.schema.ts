import { z } from 'zod';

export const uuidSchema = z.string().uuid('Invalid identifier');

/** ISO date string (date or datetime). */
export const isoDateSchema = z.string().datetime({ offset: true }).or(z.string().date());

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;
