import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
	addCartItemHandler,
	applyCouponHandler,
	clearCartHandler,
	getCartHandler,
	removeCartItemHandler,
	removeCouponHandler,
	updateCartItemHandler,
	validateCouponHandler,
} from '../handlers/cart.handlers';
import {
	addCartItemSchema,
	applyCouponSchema,
	cartItemParamsSchema,
	couponCodeParamsSchema,
	updateCartItemSchema,
} from '../validations/cart.validation';

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
			skuId: z.string().uuid().nullable(),
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
			sku: z
				.object({
					skuCode: z.string(),
					optionLabels: z.record(z.string(), z.string()),
				})
				.nullable(),
		}),
	),
	totals: z.object({
		subtotal: priceOutputSchema,
		shipping: priceOutputSchema,
		tax: priceOutputSchema,
		discount: priceOutputSchema,
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
			response: { 200: cartResponseSchema },
		},
		handler: getCartHandler,
	});

	app.post('/cart/items', {
		schema: {
			tags: ['Cart'],
			summary: 'Adicionar item ao carrinho',
			operationId: 'addCartItem',
			body: addCartItemSchema,
			response: { 200: cartResponseSchema },
		},
		handler: addCartItemHandler,
	});

	app.patch('/cart/items/:itemId', {
		schema: {
			tags: ['Cart'],
			summary: 'Atualizar quantidade do item',
			operationId: 'updateCartItem',
			params: cartItemParamsSchema,
			body: updateCartItemSchema,
			response: { 200: cartResponseSchema },
		},
		handler: updateCartItemHandler,
	});

	app.delete('/cart/items/:itemId', {
		schema: {
			tags: ['Cart'],
			summary: 'Remover item do carrinho',
			operationId: 'removeCartItem',
			params: cartItemParamsSchema,
			response: { 200: cartResponseSchema },
		},
		handler: removeCartItemHandler,
	});

	app.post('/cart/coupon', {
		schema: {
			tags: ['Cart'],
			summary: 'Aplicar cupom de desconto',
			operationId: 'applyCoupon',
			body: applyCouponSchema,
			response: { 200: cartResponseSchema },
		},
		handler: applyCouponHandler,
	});

	app.delete('/cart/coupon', {
		schema: {
			tags: ['Cart'],
			summary: 'Remover cupom',
			operationId: 'removeCoupon',
			response: { 200: cartResponseSchema },
		},
		handler: removeCouponHandler,
	});

	app.get('/coupons/validate/:code', {
		schema: {
			tags: ['Cart'],
			summary: 'Validar cupom e ver desconto sem aplicar',
			operationId: 'validateCoupon',
			params: couponCodeParamsSchema,
			response: {
				200: z.object({
					code: z.string(),
					type: z.string(),
					discount: priceOutputSchema,
				}),
			},
		},
		handler: validateCouponHandler,
	});

	app.delete('/cart', {
		schema: {
			tags: ['Cart'],
			summary: 'Limpar carrinho',
			operationId: 'clearCart',
			response: {
				200: z.object({ cleared: z.boolean() }),
			},
		},
		handler: clearCartHandler,
	});
};
