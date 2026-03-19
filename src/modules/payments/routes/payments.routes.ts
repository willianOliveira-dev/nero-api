import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
    createSetupIntentHandler,
    listPaymentMethodsHandler,
    setDefaultPaymentMethodHandler,
    deletePaymentMethodHandler,
    createPaymentIntentHandler,
} from '../handlers/payments.handlers';
import { stripeWebhookHandler } from '../handlers/stripe-webhook.handler';
import {
    paymentMethodParamsSchema,
    createPaymentIntentBodySchema,
} from '../validations/payments.validation';

const paymentMethodSchema = z.object({
    id: z.string().uuid(),
    type: z.string(),
    brand: z.string(),
    last4: z.string(),
    expMonth: z.number(),
    expYear: z.number(),
    cardholderName: z.string().nullable(),
    isDefault: z.boolean(),
    createdAt: z.date(),
});

export const paymentsRoutes: FastifyPluginAsyncZod = async (app) => {

    app.post('/me/payment-methods/setup-intent', {
        schema: {
            tags: ['Payment Methods'],
            summary: 'Criar SetupIntent para salvar cartão',
            operationId: 'createSetupIntent',
            response: {
                200: z.object({
                    clientSecret: z.string(),
                    customerId: z.string(),
                    ephemeralKey: z.string(),
                }),
            },
        },
        preHandler: [app.authenticate],
        handler: createSetupIntentHandler,
    });

    app.get('/me/payment-methods', {
        schema: {
            tags: ['Payment Methods'],
            summary: 'Listar métodos de pagamento salvos',
            operationId: 'listPaymentMethods',
            response: {
                200: z.array(paymentMethodSchema),
            },
        },
        preHandler: [app.authenticate],
        handler: listPaymentMethodsHandler,
    });

    app.patch('/me/payment-methods/:id/default', {
        schema: {
            tags: ['Payment Methods'],
            summary: 'Definir método de pagamento padrão',
            operationId: 'setDefaultPaymentMethod',
            params: paymentMethodParamsSchema,
            response: {
                200: paymentMethodSchema,
            },
        },
        preHandler: [app.authenticate],
        handler: setDefaultPaymentMethodHandler,
    });

    app.delete('/me/payment-methods/:id', {
        schema: {
            tags: ['Payment Methods'],
            summary: 'Remover método de pagamento',
            operationId: 'deletePaymentMethod',
            params: paymentMethodParamsSchema,
            response: {
                200: z.object({
                    deleted: z.boolean(),
                }),
            },
        },
        preHandler: [app.authenticate],
        handler: deletePaymentMethodHandler,
    });


    app.post('/payments/intent', {
        schema: {
            tags: ['Payments'],
            summary: 'Criar PaymentIntent para cobrar com cartão salvo',
            operationId: 'createPaymentIntent',
            body: createPaymentIntentBodySchema,
            response: {
                200: z.object({
                    clientSecret: z.string(),
                    amount: z.number(),
                    orderId: z.string().uuid(),
                }),
            },
        },
        preHandler: [app.authenticate],
        handler: createPaymentIntentHandler,
    });


    app.register(async (childApp) => {

        childApp.addContentTypeParser(
            ['application/json', 'text/plain'],
            { parseAs: 'string' },
            function (request, payload, done) {
                done(null, payload);
            }
        );

        childApp.post('/webhooks/stripe', {
            config: {
                rawBody: true,
            },
            schema: {
                tags: ['Webhooks'],
                summary: 'Webhook do Stripe',
                hide: true,
            },
            handler: stripeWebhookHandler,
        });
    });
};
