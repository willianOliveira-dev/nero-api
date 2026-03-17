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
    CreateHomeSectionInput,
    HomeSectionParams,
    ReorderHomeSectionsInput,
    UpdateHomeSectionInput,
} from '../../modules/home/validations/home.validation';

type Handler<TParams = unknown, TBody = unknown, TQuery = unknown> = RouteHandlerMethod<
    RawServerDefault,
    RawRequestDefaultExpression,
    RawReplyDefaultExpression,
    { Params: TParams; Body: TBody; Querystring: TQuery; Reply: any },
    ContextConfigDefault,
    FastifySchema,
    ZodTypeProvider
>;

export type GetHomeHandler = Handler;
export type GetHomeSectionHandler = Handler<HomeSectionParams>;
export type ListHomeSectionsHandler = Handler;
export type CreateHomeSectionHandler = Handler<unknown, CreateHomeSectionInput>;
export type UpdateHomeSectionHandler = Handler<HomeSectionParams, UpdateHomeSectionInput>;
export type DeleteHomeSectionHandler = Handler<HomeSectionParams>;
export type ReorderHomeSectionsHandler = Handler<unknown, ReorderHomeSectionsInput>;
