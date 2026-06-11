import { z } from 'zod';
import { uuidSchema } from './common.schema';

export const createOrganizationSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(200),
});

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(200).optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, digits and dashes')
    .optional(),
});

export const updateOrganizationMemberSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER']),
});

export const transferOwnershipSchema = z.object({
  newOwnerId: uuidSchema,
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type UpdateOrganizationMemberInput = z.infer<typeof updateOrganizationMemberSchema>;
export type TransferOwnershipInput = z.infer<typeof transferOwnershipSchema>;
