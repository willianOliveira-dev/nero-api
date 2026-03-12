import type { ZodHandler } from '@/types/handlers/root.handler';
import type {
    ListOrdersQuery,
    OrderParams,
} from '../../modules/orders/validations/orders.validation';

export type ListOrdersHandler = ZodHandler<unknown, unknown, ListOrdersQuery>;
export type GetOrderHandler = ZodHandler<OrderParams>;
export type CancelOrderHandler = ZodHandler<OrderParams>;

export type ListAllOrdersHandler = ZodHandler<
    unknown,
    unknown,
    ListOrdersQuery
>;
export type UpdateOrderStatusHandler = ZodHandler<
    OrderParams,
    { status: 'processing' | 'shipped' | 'delivered' | 'cancelled' }
>;
