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
    AddCartItemInput,
    ApplyCouponInput,
    CartItemParams,
    UpdateCartItemInput,
} from '../../modules/cart/validations/cart.validation';

export type GetCartHandler = Handler;
export type ClearCartHandler = Handler;
export type AddCartItemHandler = Handler<unknown, AddCartItemInput>;
export type UpdateCartItemHandler = Handler<
    CartItemParams,
    UpdateCartItemInput
>;
export type RemoveCartItemHandler = Handler<CartItemParams>;
export type ApplyCouponHandler = Handler<unknown, ApplyCouponInput>;
export type RemoveCouponHandler = Handler;
export type ValidateCouponHandler = Handler<{ code: string }>;
