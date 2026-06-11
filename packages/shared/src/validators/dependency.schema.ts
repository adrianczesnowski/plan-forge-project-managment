import { z } from 'zod';
import { uuidSchema } from './common.schema';

export const createDependencySchema = z
  .object({
    predecessorId: uuidSchema,
    successorId: uuidSchema,
    type: z.enum(['FS', 'SS', 'FF', 'SF']).default('FS'),
    lag: z.number().int().min(-365).max(365).default(0),
  })
  .refine((d) => d.predecessorId !== d.successorId, {
    message: 'Task cannot depend on itself',
    path: ['successorId'],
  });

export type CreateDependencyInput = z.infer<typeof createDependencySchema>;
