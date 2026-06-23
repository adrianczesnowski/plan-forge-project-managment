import { z } from 'zod';
import { uuidSchema } from './common.schema';

export const addHiddenSchema = z.object({
  entityType: z.enum(['PROJECT', 'SPACE']),
  entityId: uuidSchema,
});

export type AddHiddenInput = z.infer<typeof addHiddenSchema>;
