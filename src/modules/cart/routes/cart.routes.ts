import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { CartController } from '../controllers/cart.controller';
import {
    addCartItemSchema,
    applyCouponSchema,
    cartItemParamsSchema,
    couponCodeParamsSchema,
    updateCartItemSchema,
} from '../validations/cart.validation';

const controller = new CartController();

const priceOutputSchema = z.object({
    cents: z.number(),
    value: z.number(),
    formatted: z.string(),
});

const cartResponseSchema = z.object({
    id: z.string().uuid(),
    coupon: z
        .object({
            code: z.string(),
            type: z.string(),
        })
        .nullable(),
    items: z.array(
        z.object({
            id: z.string().uuid(),
            productId: z.string().uuid(),
            variantId: z.string().uuid().nullable(),
            quantity: z.number(),
            price: priceOutputSchema,
            subtotal: priceOutputSchema,
            product: z
                .object({
                    name: z.string(),
                    slug: z.string(),
                    imageUrl: z.string().url().nullable(),
                })
                .nullable(),
            variant: z
                .object({
                    sku: z.string(),
                    attributes: z.record(z.string(), z.string()),
                })
                .nullable(),
        }),
    ),
    totals: z.object({
        subtotal: priceOutputSchema,
        shipping: priceOutputSchema,
        tax: priceOutputSchema,
        total: priceOutputSchema,
        itemCount: z.number(),
    }),
    updatedAt: z.date(),
});

export const cartRoutes: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preHandler', app.authenticate);

    app.get('/cart', {
        schema: {
            tags: ['Cart'],
            summary: 'Retornar carrinho do usuário',
            operationId: 'getCart',
            response: { 200: z.object({ data: cartResponseSchema }) },
        },
        handler: controller.getCart,
    });

    app.post('/cart/items', {
        schema: {
            tags: ['Cart'],
            summary: 'Adicionar item ao carrinho',
            operationId: 'addCartItem',
            body: addCartItemSchema,
            response: { 200: z.object({ data: cartResponseSchema }) },
        },
        handler: controller.addItem,
    });

    app.patch('/cart/items/:itemId', {
        schema: {
            tags: ['Cart'],
            summary: 'Atualizar quantidade do item',
            operationId: 'updateCartItem',
            params: cartItemParamsSchema,
            body: updateCartItemSchema,
            response: { 200: z.object({ data: cartResponseSchema }) },
        },
        handler: controller.updateItem,
    });

    app.delete('/cart/items/:itemId', {
        schema: {
            tags: ['Cart'],
            summary: 'Remover item do carrinho',
            operationId: 'removeCartItem',
            params: cartItemParamsSchema,
            response: { 200: z.object({ data: cartResponseSchema }) },
        },
        handler: controller.removeItem,
    });

    app.post('/cart/coupon', {
        schema: {
            tags: ['Cart'],
            summary: 'Aplicar cupom de desconto',
            operationId: 'applyCoupon',
            body: applyCouponSchema,
            response: { 200: z.object({ data: cartResponseSchema }) },
        },
        handler: controller.applyCoupon,
    });

    app.delete('/cart/coupon', {
        schema: {
            tags: ['Cart'],
            summary: 'Remover cupom',
            operationId: 'removeCoupon',
            response: { 200: z.object({ data: cartResponseSchema }) },
        },
        handler: controller.removeCoupon,
    });

    app.get('/coupons/validate/:code', {
        schema: {
            tags: ['Cart'],
            summary: 'Validar cupom e ver desconto sem aplicar',
            operationId: 'validateCoupon',
            params: couponCodeParamsSchema,
            response: {
                200: z.object({
                    data: z.object({
                        code: z.string(),
                        type: z.string(),
                        discount: priceOutputSchema,
                    }),
                }),
            },
        },
        handler: controller.validateCoupon,
    });

    app.delete('/cart', {
        schema: {
            tags: ['Cart'],
            summary: 'Limpar carrinho',
            operationId: 'clearCart',
            response: {
                200: z.object({ data: z.object({ cleared: z.boolean() }) }),
            },
        },
        handler: controller.clearCart,
    });
};
