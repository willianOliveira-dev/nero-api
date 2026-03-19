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

import type { WishlistProductParams } from '../../modules/wishlist/validations/wishlist.validation';

export type GetWishlistHandler = Handler;
export type AddWishlistItemHandler = Handler<WishlistProductParams>;
export type RemoveWishlistItemHandler = Handler<WishlistProductParams>;
export type CheckWishlistItemHandler = Handler<WishlistProductParams>;
