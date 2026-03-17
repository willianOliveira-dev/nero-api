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
    CreateCategoryInput,
    ReorderCategoriesInput,
    UpdateCategoryInput,
} from '../../modules/categories/validations/categories.validation';

type Handler<TParams = unknown, TBody = unknown, TQuery = unknown> = RouteHandlerMethod<
    RawServerDefault,
    RawRequestDefaultExpression,
    RawReplyDefaultExpression,
    { Params: TParams; Body: TBody; Querystring: TQuery; Reply: any },
    ContextConfigDefault,
    FastifySchema,
    ZodTypeProvider
>;

export type ListCategoriesHandler = Handler;
export type GetCategoryBySlugHandler = Handler<{ slug: string }>;
export type CreateCategoryHandler = Handler<unknown, CreateCategoryInput>;
export type UpdateCategoryHandler = Handler<{ id: string }, UpdateCategoryInput>;
export type DeactivateCategoryHandler = Handler<{ id: string }>;
export type ReorderCategoriesHandler = Handler<unknown, ReorderCategoriesInput>;
export type PresignCategoryImageHandler = Handler;