import { z } from 'zod';
import { uuidSchema } from './common.schema';

const colorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex value like #3b82f6');

export const createSpaceSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  description: z.string().trim().max(2000).optional(),
  color: colorSchema.optional(),
  icon: z.string().trim().max(50).optional(),
});

export const updateSpaceSchema = createSpaceSchema.partial().extend({
  description: z.string().trim().max(2000).nullable().optional(),
  color: colorSchema.nullable().optional(),
  icon: z.string().trim().max(50).nullable().optional(),
});

export const reorderSpacesSchema = z.object({
  spaceIds: z.array(uuidSchema).min(1),
});

export const addSpaceMemberSchema = z.object({
  userId: uuidSchema,
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']).default('MEMBER'),
});

export const updateSpaceMemberSchema = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
});

export type CreateSpaceInput = z.infer<typeof createSpaceSchema>;
export type UpdateSpaceInput = z.infer<typeof updateSpaceSchema>;
export type ReorderSpacesInput = z.infer<typeof reorderSpacesSchema>;
export type AddSpaceMemberInput = z.infer<typeof addSpaceMemberSchema>;
export type UpdateSpaceMemberInput = z.infer<typeof updateSpaceMemberSchema>;
