import type {
    ContextConfigDefault,
    FastifySchema,
    RawReplyDefaultExpression,
    RawRequestDefaultExpression,
    RawServerDefault,
    RouteHandlerMethod,
} from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import type {
    CreateReviewInput,
    ListReviewsQuery,
    ReviewParams,
} from '../../modules/reviews/validations/reviews.validation';

type Handler<TParams = unknown, TBody = unknown, TQuery = unknown> = RouteHandlerMethod<
    RawServerDefault,
    RawRequestDefaultExpression,
    RawReplyDefaultExpression,
    { Params: TParams; Body: TBody; Querystring: TQuery; Reply: any },
    ContextConfigDefault,
    FastifySchema,
    ZodTypeProvider
>;

export type ListReviewsHandler = Handler<unknown, unknown, ListReviewsQuery>;
export type CreateReviewHandler = Handler<unknown, CreateReviewInput>;
export type ToggleLikeHandler = Handler<ReviewParams>;
export type PresignReviewMediaHandler = Handler;
