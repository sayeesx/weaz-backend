import { z } from 'zod';

export const createSessionSchema = z.object({
  businessSlug: z.string().default('weaz'),
});

export const sendMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
