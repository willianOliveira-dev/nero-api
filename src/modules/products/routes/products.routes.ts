import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
	archiveProductHandler,
	confirmImageHandler,
	createProductHandler,
	deleteImageHandler,
	getProductByIdHandler,
	getProductBySlugHandler,
	listImagesHandler,
	presignImageHandler,
	reorderImagesHandler,
	searchProductsHandler,
	updateImageHandler,
	updateProductHandler,
	updateSkuHandler,
} from '../handlers/products.handlers';
import {
	confirmProductImageSchema,
	createProductSchema,
	imageParamsSchema,
	productParamsSchema,
	productSlugParamsSchema,
	reorderImagesSchema,
	searchProductsSchema,
	skuParamsSchema,
	updateProductImageSchema,
	updateProductSchema,
	updateSkuSchema,
} from '../validations/products.validation';

const priceOutputSchema = z.object({
	cents: z.number(),
	value: z.number(),
	formatted: z.string(),
});

const productPriceOutputSchema = z.object({
	current: priceOutputSchema,
	original: priceOutputSchema.nullable(),
	discountPercent: z.number().nullable(),
});

const pricingSchema = z
	.object({
		displayPriceMin: priceOutputSchema,
		displayPriceMax: priceOutputSchema,
		priceRange: z.string(),
		hasPriceVariation: z.boolean(),
	})
	.nullable();

const simpleProductSchema = z
	.object({
		price: productPriceOutputSchema,
		stock: z.number(),
		skuCode: z.string(),
		ean: z.string().nullable(),
		isOutOfStock: z.boolean(),
	})
	.nullable();

const variationOptionOutputSchema = z.object({
	id: z.string(),
	value: z.string(),
	imageUrl: z.string().nullable(),
	position: z.number(),
});

const variationTypeOutputSchema = z.object({
	id: z.string(),
	name: z.string(),
	position: z.number(),
	hasImage: z.boolean(),
	options: z.array(variationOptionOutputSchema),
});

const skuOutputSchema = z.object({
	id: z.string(),
	optionIds: z.array(z.string()),
	optionLabels: z.record(z.string(), z.string()),
	price: priceOutputSchema,
	compareAtPrice: priceOutputSchema.nullable(),
	discountPercent: z.number().nullable(),
	stock: z.number(),
	skuCode: z.string(),
	ean: z.string().nullable(),
	isOutOfStock: z.boolean(),
	isActive: z.boolean(),
});

const cartRulesSchema = z.object({
	maxQuantityPerSku: z.string(),
	outOfStockBehavior: z.string(),
});

const brandSchema = z
	.object({
		name: z.string(),
		slug: z.string(),
		logo: z.string().nullable().optional(),
	})
	.nullable();

const ratingSchema = z.object({
	average: z.number(),
	count: z.number(),
	sold: z.number(),
});

const categoryBreadcrumbSchema = z.object({
	name: z.string(),
	slug: z.string(),
});

const productCardSchema = z.object({
	id: z.string(),
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
	brand: brandSchema,
	rating: ratingSchema,
	freeShipping: z.boolean(),
});

const productListSchema = z.object({
	items: z.array(productCardSchema),
	total: z.number(),
	nextCursor: z.string().nullable(),
	hasMore: z.boolean(),
});

const productDetailSchema = z.object({
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	description: z.string().nullable(),
	status: z.string(),
	thumbnailUrl: z.string().nullable(),
	hasVariations: z.boolean(),
	simpleProduct: simpleProductSchema,
	pricing: pricingSchema,
	variationTypes: z.array(variationTypeOutputSchema).nullable(),
	skus: z.array(skuOutputSchema).nullable(),
	cartRules: cartRulesSchema,
	brand: brandSchema,
	categories: z.array(categoryBreadcrumbSchema),
	images: z.array(
		z.object({
			id: z.string(),
			url: z.string(),
			alt: z.string().nullable(),
			isPrimary: z.boolean(),
		}),
	),
	rating: ratingSchema,
	features: z.object({
		freeShipping: z.boolean(),
		gender: z.string(),
		sizeChart: z.string().nullable(),
	}),
	userContext: z.object({
		isWishlisted: z.boolean(),
	}),
});

const imageSchema = z.object({
	id: z.string(),
	productId: z.string(),
	url: z.string(),
	altText: z.string().nullable(),
	position: z.number(),
	isPrimary: z.boolean(),
});



export const productsRoutes: FastifyPluginAsyncZod = async (app) => {
	

	app.get('/products/search', {
		schema: {
			tags: ['Products'],
			summary: 'Buscar produtos',
			operationId: 'searchProducts',
			querystring: searchProductsSchema,
			response: { 200: productListSchema },
		},
		handler: searchProductsHandler,
	});

	app.get('/products/slug/:slug', {
		schema: {
			tags: ['Products'],
			summary: 'Obter produto por slug (PDP)',
			operationId: 'getProductBySlug',
			params: productSlugParamsSchema,
			response: { 200: productDetailSchema },
		},
		handler: getProductBySlugHandler,
	});



	app.get('/admin/products/:id', {
		schema: {
			tags: ['Admin Products'],
			summary: 'Obter produto por ID',
			operationId: 'getProductById',
			params: productParamsSchema,
			response: { 200: productDetailSchema },
		},
		preHandler: app.authenticate,
		handler: getProductByIdHandler,
	});

	app.post('/admin/products', {
		schema: {
			tags: ['Admin Products'],
			summary: 'Criar produto',
			operationId: 'createProduct',
			body: createProductSchema,
			response: { 201: productDetailSchema },
		},
		preHandler: app.authenticate,
		handler: createProductHandler,
	});

	app.patch('/admin/products/:id', {
		schema: {
			tags: ['Admin Products'],
			summary: 'Atualizar produto',
			operationId: 'updateProduct',
			params: productParamsSchema,
			body: updateProductSchema,
			response: { 200: productDetailSchema },
		},
		preHandler: app.authenticate,
		handler: updateProductHandler,
	});

	app.delete('/admin/products/:id', {
		schema: {
			tags: ['Admin Products'],
			summary: 'Arquivar produto',
			operationId: 'archiveProduct',
			params: productParamsSchema,
			response: { 200: z.object({ status: z.string() }) },
		},
		preHandler: app.authenticate,
		handler: archiveProductHandler,
	});

	
	app.patch('/admin/products/:id/skus/:skuId', {
		schema: {
			tags: ['Admin Products'],
			summary: 'Atualizar SKU',
			operationId: 'updateProductSku',
			params: skuParamsSchema,
			body: updateSkuSchema,
			response: { 200: z.object({ id: z.string() }) },
		},
		preHandler: app.authenticate,
		handler: updateSkuHandler,
	});


	app.get('/admin/products/:id/images', {
		schema: {
			tags: ['Admin Products'],
			summary: 'Listar imagens do produto',
			operationId: 'listProductImages',
			params: productParamsSchema,
			response: { 200: z.array(imageSchema) },
		},
		preHandler: app.authenticate,
		handler: listImagesHandler,
	});

	app.post('/admin/products/:id/images/presign', {
		schema: {
			tags: ['Admin Products'],
			summary: 'Gerar URL pré-assinada para upload de imagem',
			operationId: 'presignProductImage',
			params: productParamsSchema,
			response: {
				200: z.object({
					signature: z.string(),
					timestamp: z.number(),
					apiKey: z.string(),
					cloudName: z.string(),
					folder: z.string(),
					publicId: z.string(),
				}),
			},
		},
		preHandler: app.authenticate,
		handler: presignImageHandler,
	});

	app.post('/admin/products/:id/images', {
		schema: {
			tags: ['Admin Products'],
			summary: 'Confirmar upload de imagem',
			operationId: 'confirmProductImage',
			params: productParamsSchema,
			body: confirmProductImageSchema,
			response: { 201: imageSchema },
		},
		preHandler: app.authenticate,
		handler: confirmImageHandler,
	});

	app.patch('/admin/products/:id/images/:iid', {
		schema: {
			tags: ['Admin Products'],
			summary: 'Atualizar metadados da imagem',
			operationId: 'updateProductImage',
			params: imageParamsSchema,
			body: updateProductImageSchema,
			response: { 200: imageSchema },
		},
		preHandler: app.authenticate,
		handler: updateImageHandler,
	});

	app.delete('/admin/products/:id/images/:iid', {
		schema: {
			tags: ['Admin Products'],
			summary: 'Deletar imagem',
			operationId: 'deleteProductImage',
			params: imageParamsSchema,
			response: { 200: z.object({ deleted: z.boolean() }) },
		},
		preHandler: app.authenticate,
		handler: deleteImageHandler,
	});

	app.patch('/admin/products/:id/images/reorder', {
		schema: {
			tags: ['Admin Products'],
			summary: 'Reordenar imagens',
			operationId: 'reorderProductImages',
			params: productParamsSchema,
			body: reorderImagesSchema,
			response: { 200: z.object({ reordered: z.boolean() }) },
		},
		preHandler: app.authenticate,
		handler: reorderImagesHandler,
	});
};
