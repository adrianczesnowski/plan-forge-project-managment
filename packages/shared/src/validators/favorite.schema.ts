import { z } from 'zod';
import { uuidSchema } from './common.schema';

export const addFavoriteSchema = z.object({
  entityType: z.enum(['PROJECT', 'SPACE']),
  entityId: uuidSchema,
});

export type AddFavoriteInput = z.infer<typeof addFavoriteSchema>;
