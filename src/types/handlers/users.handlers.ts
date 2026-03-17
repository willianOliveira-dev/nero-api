import type {
    ContextConfigDefault,
    FastifySchema,
    RawReplyDefaultExpression,
    RawRequestDefaultExpression,
    RawServerDefault,
    RouteHandlerMethod,
} from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { UpdateProfileInput } from '../../modules/users/validations/users.validation';

type Handler<TParams = unknown, TBody = unknown, TQuery = unknown> = RouteHandlerMethod<
    RawServerDefault,
    RawRequestDefaultExpression,
    RawReplyDefaultExpression,
    { Params: TParams; Body: TBody; Querystring: TQuery; Reply: any },
    ContextConfigDefault,
    FastifySchema,
    ZodTypeProvider
>;

export type GetMeHandler = Handler;
export type UpdateMeHandler = Handler<unknown, UpdateProfileInput>;
export type PresignAvatarHandler = Handler;
export type ConfirmAvatarHandler = Handler<unknown, { avatarUrl: string }>;
export type RemoveAvatarHandler = Handler;