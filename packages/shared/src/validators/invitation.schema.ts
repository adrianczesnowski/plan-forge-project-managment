import { z } from 'zod';

export const createInvitationSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
