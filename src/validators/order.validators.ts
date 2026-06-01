import { z } from 'zod';

export const orderIdParamSchema = z.object({
  orderId: z.string().uuid(),
});

export type OrderIdParam = z.infer<typeof orderIdParamSchema>;
