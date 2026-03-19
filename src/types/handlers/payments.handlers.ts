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
    PaymentMethodParams,
    CreatePaymentIntentBody,
} from '../../modules/payments/validations/payments.validation';

export type CreateSetupIntentHandler = Handler;
export type ListPaymentMethodsHandler = Handler;
export type SetDefaultPaymentMethodHandler = Handler<PaymentMethodParams>;
export type DeletePaymentMethodHandler = Handler<PaymentMethodParams>;
export type CreatePaymentIntentHandler = Handler<unknown, CreatePaymentIntentBody>;
