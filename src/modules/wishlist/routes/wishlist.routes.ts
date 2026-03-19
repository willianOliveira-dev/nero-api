import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
	addWishlistItemHandler,
	checkWishlistItemHandler,
	getWishlistHandler,
	removeWishlistItemHandler,
} from '../handlers/wishlist.handlers';
import { wishlistProductParamsSchema } from '../validations/wishlist.validation';

const priceOutputSchema = z.object({
	cents: z.number(),
	value: z.number(),
	formatted: z.string(),
});

const productCardSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	slug: z.string(),
	status: z.string(),
	thumbnailUrl: z.string().nullable(),
	hasVariations: z.boolean(),
	pricing: z
		.object({
			displayPriceMin: priceOutputSchema,
			priceRange: z.string(),
			hasPriceVariation: z.boolean(),
		})
		.nullable(),
	brand: z
		.object({
			name: z.string(),
			slug: z.string(),
		})
		.nullable(),
	rating: z.object({
		average: z.number(),
		count: z.number(),
		sold: z.number(),
	}),
	freeShipping: z.boolean(),
});

const wishlistResponseSchema = z.object({
	items: z.array(productCardSchema),
	total: z.number(),
});

const wishlistMutationResponseSchema = z.object({
	added: z.boolean().optional(),
	removed: z.boolean().optional(),
	productId: z.string().uuid(),
});

const wishlistCheckResponseSchema = z.object({
	productId: z.string().uuid(),
	isWishlisted: z.boolean(),
});

export const wishlistRoutes: FastifyPluginAsyncZod = async (app) => {
	app.addHook('preHandler', app.authenticate);

	app.get('/wishlist', {
		schema: {
			tags: ['Wishlist'],
			summary: 'Listar produtos da wishlist',
			operationId: 'getWishlist',
			response: { 200: wishlistResponseSchema },
		},
		handler: getWishlistHandler,
	});

	app.post('/wishlist/:productId', {
		schema: {
			tags: ['Wishlist'],
			summary: 'Adicionar produto à wishlist',
			operationId: 'addWishlistItem',
			params: wishlistProductParamsSchema,
			response: { 200: wishlistMutationResponseSchema },
		},
		handler: addWishlistItemHandler,
	});

	app.delete('/wishlist/:productId', {
		schema: {
			tags: ['Wishlist'],
			summary: 'Remover produto da wishlist',
			operationId: 'removeWishlistItem',
			params: wishlistProductParamsSchema,
			response: { 200: wishlistMutationResponseSchema },
		},
		handler: removeWishlistItemHandler,
	});

	app.get('/wishlist/check/:productId', {
		schema: {
			tags: ['Wishlist'],
			summary: 'Verificar se produto está na wishlist',
			operationId: 'checkWishlistItem',
			params: wishlistProductParamsSchema,
			response: { 200: wishlistCheckResponseSchema },
		},
		handler: checkWishlistItemHandler,
	});
};
