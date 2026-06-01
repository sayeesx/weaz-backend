import { z } from 'zod';

export const createSupportTicketSchema = z.object({
  businessSlug: z.string().default('weaz'),
  orderId: z.string().uuid().optional(),
  issue_type: z.string().min(1),
  description: z.string().min(1),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  requires_human: z.boolean().default(false),
});

export type CreateSupportTicketInput = z.infer<typeof createSupportTicketSchema>;
