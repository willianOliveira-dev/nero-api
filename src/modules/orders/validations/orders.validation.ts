 
import { z } from 'zod';
 
export const orderParamsSchema = z.object({
    id: z.string().uuid('ID de pedido inválido.'),
});
 
export const listOrdersQuerySchema = z.object({
    status: z
        .enum(['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'])
        .optional(),
    limit:  z.coerce.number().int().min(1).max(50).default(20),
    cursor: z.string().uuid().optional(),
});
 
export const updateOrderStatusSchema = z.object({
    status: z.enum(['processing', 'shipped', 'delivered', 'cancelled']),
});
 
export type OrderParams        = z.infer<typeof orderParamsSchema>;
export type ListOrdersQuery    = z.infer<typeof listOrdersQuerySchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;