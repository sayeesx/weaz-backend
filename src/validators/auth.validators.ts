import { z } from 'zod';

export const updateProfileSchema = z.object({
  full_name: z.string().optional(),
  preferred_language: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
