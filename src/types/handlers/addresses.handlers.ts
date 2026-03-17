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
    CreateAddressInput,
    UpdateAddressInput,
} from '../../modules/addresses/validations/addresses.validation';

type Handler<TParams = unknown, TBody = unknown, TQuery = unknown> = RouteHandlerMethod<
    RawServerDefault,
    RawRequestDefaultExpression,
    RawReplyDefaultExpression,
    { Params: TParams; Body: TBody; Querystring: TQuery; Reply: any },
    ContextConfigDefault,
    FastifySchema,
    ZodTypeProvider
>;

export type ListAddressesHandler = Handler;
export type GetDefaultAddressHandler = Handler;
export type CreateAddressHandler = Handler<unknown, CreateAddressInput>;
export type UpdateAddressHandler = Handler<{ id: string }, UpdateAddressInput>;
export type SetDefaultAddressHandler = Handler<{ id: string }>;
export type DeleteAddressHandler = Handler<{ id: string }>;