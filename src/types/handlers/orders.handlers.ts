import type {
    ContextConfigDefault,
    FastifySchema,
    RawReplyDefaultExpression,
    RawRequestDefaultExpression,
    RawServerDefault,
    RouteHandlerMethod,
} from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

type Handler<
    TParams = unknown,
    TBody = unknown,
    TQuery = unknown,
> = RouteHandlerMethod<
    RawServerDefault,
    RawRequestDefaultExpression,
    RawReplyDefaultExpression,
    { Params: TParams; Body: TBody; Querystring: TQuery; Reply: any },
    ContextConfigDefault,
    FastifySchema,
    ZodTypeProvider
>;

import type {
    ListOrdersQuery,
    OrderParams,
    UpdateOrderStatusInput,
} from '../../modules/orders/validations/orders.validation';

export type ListOrdersHandler = Handler<unknown, unknown, ListOrdersQuery>;
export type GetOrderHandler = Handler<OrderParams>;
export type CancelOrderHandler = Handler<OrderParams>;
export type ListAllOrdersHandler = Handler<unknown, unknown, ListOrdersQuery>;
export type UpdateOrderStatusHandler = Handler<
    OrderParams,
    UpdateOrderStatusInput
>;
