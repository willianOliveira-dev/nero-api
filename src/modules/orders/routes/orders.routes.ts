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

const productSnapshotSchema = z.object({
    name: z.string(),
    imageUrl: z.string(),
    optionLabels: z.record(z.string(), z.string()).optional(),
}).passthrough();

const orderItemSchema = z.object({
    id: z.string().uuid(),
    productId: z.string().uuid().nullable(),
    quantity: z.number(),
    price: priceOutputSchema,
    subtotal: priceOutputSchema,
    product: productSnapshotSchema,
    isReviewed: z.boolean(),
    review: z.object({
        id: z.string(),
        rating: z.number(),
        title: z.string().nullable(),
        comment: z.string().nullable(),
        createdAt: z.date(),
        media: z.array(z.object({
            id: z.string(),
            type: z.enum(['image', 'video']),
            url: z.string().url(),
        })),
    }).nullable().optional(),
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

    shippingAddress: z.object({
        recipientName: z.string(),
        street: z.string(),
        city: z.string(),
        state: z.string(),
        zipCode: z.string(),
        country: z.string(),
        complement: z.string().nullish(),
    }).passthrough().nullable(),
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
            product: productSnapshotSchema,
        }),
    ),
    createdAt: z.date(),
});

const metaSchema = z.object({
    hasMore: z.boolean(),
    nextCursor: z.string().uuid().nullable(),
});


export const ordersRoutes: FastifyPluginAsyncZod = async (app) => {
	app.addHook('preHandler', app.authenticate);
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
        
        handler: updateOrderStatusHandler,
    });
};
