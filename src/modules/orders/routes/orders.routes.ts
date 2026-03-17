import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
    cancelOrderHandler,
    getOrderHandler,
    listAllOrdersHandler,
    listOrdersHandler,
    updateOrderStatusHandler,
} from '../handlers/orders.handlers';
import {
    listOrdersQuerySchema,
    orderParamsSchema,
    updateOrderStatusSchema,
} from '../validations/orders.validation';

const priceOutputSchema = z.object({
    cents: z.number(),
    value: z.number(),
    formatted: z.string(),
});

const orderItemSchema = z.object({
    id: z.string().uuid(),
    quantity: z.number(),
    price: priceOutputSchema,
    subtotal: priceOutputSchema,
    // TODO  POSSIVEL ERROR FUTURO - MANTER PARA TESTE
    product: z.record(z.string(), z.string()),
});

const orderDetailSchema = z.object({
    id: z.string().uuid(),
    status: z.enum([
        'pending',
        'paid',
        'processing',
        'shipped',
        'delivered',
        'cancelled',
    ]),
    amounts: z.object({
        subtotal: priceOutputSchema,
        shipping: priceOutputSchema,
        tax: priceOutputSchema,
        discount: priceOutputSchema,
        total: priceOutputSchema,
    }),
    coupon: z
        .object({
            code: z.string(),
            type: z.string(),
        })
        .nullable(),

    // TODO - POSSIVEL ERROR FUTURO - MANTER PARA TESTE
    shippingAddress: z.record(z.string(), z.string()),
    paymentMethod: z
        .object({
            type: z.string(),
            brand: z.string().nullable(),
            last4: z.string().nullable(),
        })
        .nullable(),
    items: z.array(orderItemSchema),
    createdAt: z.date(),
    updatedAt: z.date(),
});

const orderSummarySchema = z.object({
    id: z.string().uuid(),
    status: z.string(),
    total: priceOutputSchema,
    itemCount: z.number(),
    items: z.array(
        z.object({
            quantity: z.number(),
            // TODO -  POSSIVEL ERROR FUTURO - MANTER PARA TESTE
            product: z.record(z.string(), z.string()),
        }),
    ),
    createdAt: z.date(),
});

const metaSchema = z.object({
    hasMore: z.boolean(),
    nextCursor: z.string().uuid().nullable(),
});

export const ordersRoutes: FastifyPluginAsyncZod = async (app) => {
    app.get('/orders', {
        schema: {
            tags: ['Orders'],
            summary: 'Listar pedidos do usuário',
            operationId: 'listOrders',
            querystring: listOrdersQuerySchema,
            response: {
                200: z.object({
                    data: z.array(orderSummarySchema),
                    hasMore: z.boolean(),
                    nextCursor: z.string().uuid().nullable(),
                }),
            },
        },
        preHandler: [app.authenticate],
        handler: listOrdersHandler,
    });

    app.get('/orders/:id', {
        schema: {
            tags: ['Orders'],
            summary: 'Detalhe do pedido',
            operationId: 'getOrder',
            params: orderParamsSchema,
            response: { 200: orderDetailSchema },
        },
        preHandler: [app.authenticate],
        handler: getOrderHandler,
    });

    app.post('/orders/:id/cancel', {
        schema: {
            tags: ['Orders'],
            summary: 'Cancelar pedido',
            operationId: 'cancelOrder',
            params: orderParamsSchema,
            response: { 200: orderDetailSchema },
        },
        preHandler: [app.authenticate],
        handler: cancelOrderHandler,
    });

    app.get('/admin/orders', {
        schema: {
            tags: ['Orders'],
            summary: 'Listar todos os pedidos (admin)',
            operationId: 'listAllOrders',
            querystring: listOrdersQuerySchema,
            response: {
                200: z.object({
                    data: z.array(orderSummarySchema),
                    meta: metaSchema,
                }),
            },
        },
        preHandler: [app.authenticate],
        handler: listAllOrdersHandler,
    });

    app.patch('/admin/orders/:id/status', {
        schema: {
            tags: ['Orders'],
            summary: 'Atualizar status do pedido (admin)',
            operationId: 'updateOrderStatus',
            params: orderParamsSchema,
            body: updateOrderStatusSchema,
            response: { 200: orderDetailSchema },
        },
        preHandler: [app.authenticate],
        handler: updateOrderStatusHandler,
    });
};
