import { z } from 'zod';

export const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  avatarUrl: z.string().url().max(500).nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
