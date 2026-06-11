import { z } from 'zod';
import { isoDateSchema, uuidSchema } from './common.schema';

export const createSharedListSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  description: z.string().trim().max(2000).optional(),
  type: z.enum(['PERSONAL', 'SHARED']).default('PERSONAL'),
  projectId: uuidSchema.optional(),
});

export const updateSharedListSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  type: z.enum(['PERSONAL', 'SHARED']).optional(),
});

export const createSharedListItemSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(500),
  assigneeId: uuidSchema.optional(),
  dueDate: isoDateSchema.optional(),
});

export const updateSharedListItemSchema = z.object({
  title: z.string().trim().min(1).max(500).optional(),
  isCompleted: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
  assigneeId: uuidSchema.nullable().optional(),
  dueDate: isoDateSchema.nullable().optional(),
});

export const shareListSchema = z.object({
  userId: uuidSchema,
  access: z.enum(['CAN_VIEW', 'CAN_EDIT']).default('CAN_VIEW'),
});

export type CreateSharedListInput = z.infer<typeof createSharedListSchema>;
export type UpdateSharedListInput = z.infer<typeof updateSharedListSchema>;
export type CreateSharedListItemInput = z.infer<typeof createSharedListItemSchema>;
export type UpdateSharedListItemInput = z.infer<typeof updateSharedListItemSchema>;
export type ShareListInput = z.infer<typeof shareListSchema>;
