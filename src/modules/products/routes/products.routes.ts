import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
    archiveProductHandler,
    confirmImageHandler,
    createProductHandler,
    createVariantHandler,
    deleteImageHandler,
    getProductByIdHandler,
    getProductBySlugHandler,
    listImagesHandler,
    listVariantsHandler,
    presignImageHandler,
    reorderImagesHandler,
    searchProductsHandler,
    updateImageHandler,
    updateProductHandler,
    updateVariantHandler,
} from '../handlers/products.handlers';
import {
    confirmProductImageSchema,
    createProductSchema,
    createVariantSchema,
    imageParamsSchema,
    productParamsSchema,
    productSlugParamsSchema,
    reorderImagesSchema,
    searchProductsSchema,
    updateProductImageSchema,
    updateProductSchema,
    updateVariantSchema,
    variantParamsSchema,
} from '../validations/products.validation';

const priceOutputSchema = z.object({
    cents: z.number(),
    value: z.number(),
    formatted: z.string(),
});

const productPriceSchema = z.object({
    current: priceOutputSchema,
    original: priceOutputSchema.nullable(),
    discountPercent: z.number().nullable(),
});

const productCardSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    price: productPriceSchema,
    brand: z.object({
        name: z.string(),
        slug: z.string(),
    }).nullable(),
    rating: z.object({
        average: z.number(),
        count: z.number(),
    }),
    imageUrl: z.string().url().nullable(),
    freeShipping: z.boolean(),
});

const productDetailSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable(),
    status: z.string(),
    price: productPriceSchema,
    brand: z.object({
        name: z.string(),
        slug: z.string(),
        logo: z.string().nullable(),
    }).nullable(),
    categories: z.array(z.object({
        name: z.string(),
        slug: z.string(),
    })),
    images: z.array(z.object({
        id: z.string().uuid(),
        url: z.string().url(),
        alt: z.string().nullable(),
        isPrimary: z.boolean(),
    })),
    variants: z.array(z.object({
        id: z.string().uuid(),
        sku: z.string(),
        stock: z.number(),
        attributes: z.record(z.string(), z.unknown()),
        price: productPriceSchema,
        images: z.array(z.object({
            id: z.string().uuid(),
            url: z.string().url(),
            alt: z.string().nullable(),
        })),
    })),
    rating: z.object({
        average: z.number(),
        count: z.number(),
        sold: z.number(),
    }),
    features: z.object({
        freeShipping: z.boolean(),
        gender: z.string(),
        sizeChart: z.string().nullable(),
    }),
    userContext: z.object({
        isWishlisted: z.boolean(),
    }),
});

// Full product record (admin responses)
const productRawSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable(),
    basePrice: z.number(),
    originalPrice: z.number().nullable(),
    gender: z.enum(['men', 'women', 'kids', 'unisex']),
    status: z.enum(['draft', 'active', 'archived']),
    freeShipping: z.boolean(),
    soldCount: z.number(),
    ratingAvg: z.string().nullable(),
    ratingCount: z.number(),
    sizeChartUrl: z.string().nullable(),
    categoryId: z.string().uuid().nullable(),
    brandId: z.string().uuid().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

const variantRawSchema = z.object({
    id: z.string().uuid(),
    productId: z.string().uuid(),
    sku: z.string(),
    gtin: z.string().nullable(),
    price: z.number().nullable(),
    stock: z.number(),
    attributes: z.record(z.string(), z.unknown()),
    isActive: z.boolean(),
    weightInGrams: z.number().nullable(),
    lengthCm: z.string().nullable(),
    widthCm: z.string().nullable(),
    heightCm: z.string().nullable(),
});

const imageRawSchema = z.object({
    id: z.string().uuid(),
    productId: z.string().uuid(),
    variantId: z.string().uuid().nullable(),
    url: z.string().url(),
    altText: z.string().nullable(),
    position: z.number(),
    isPrimary: z.boolean(),
});

export const productsRoutes: FastifyPluginAsyncZod = async (app) => {
    app.get('/products/search', {
        schema: {
            tags: ['Products'],
            summary: 'Busca com filtros e full-text search',
            operationId: 'searchProducts',
            querystring: searchProductsSchema,
            response: {
                200: z.object({
                    items: z.array(productCardSchema),
                    total: z.number(),
                    nextCursor: z.string().uuid().nullable(),
                    hasMore: z.boolean(),
                }),
            },
        },
        handler: searchProductsHandler,
    });

    app.get('/products/slug/:slug', {
        schema: {
            tags: ['Products'],
            summary: 'Detalhe do produto por slug — PDP',
            operationId: 'getProductBySlug',
            params: productSlugParamsSchema,
            response: { 200: productDetailSchema },
        },
        handler: getProductBySlugHandler,
    });

    app.get('/products/:id', {
        schema: {
            tags: ['Products'],
            summary: 'Produto por ID (uso interno/admin)',
            operationId: 'getProductById',
            params: productParamsSchema,
            response: { 200: productCardSchema },
        },
        handler: getProductByIdHandler,
    });

    app.get('/products/:id/variants', {
        schema: {
            tags: ['Products'],
            summary: 'Listar variantes do produto',
            operationId: 'listProductVariants',
            params: productParamsSchema,
            response: { 200: z.array(z.unknown()) }, // Simplified for now, can be expanded if needed
        },
        handler: listVariantsHandler,
    });

    app.get('/products/:id/images', {
        schema: {
            tags: ['Products'],
            summary: 'Listar galeria de imagens',
            operationId: 'listProductImages',
            params: productParamsSchema,
            response: { 200: z.array(imageRawSchema) },
        },
        handler: listImagesHandler,
    });

    app.post('/admin/products', {
        schema: {
            tags: ['Products'],
            summary: 'Criar produto (admin)',
            operationId: 'createProduct',
            body: createProductSchema,
            response: { 201: productRawSchema },
        },
        preHandler: [app.authenticate],
        handler: createProductHandler,
    });

    app.patch('/admin/products/:id', {
        schema: {
            tags: ['Products'],
            summary: 'Atualizar produto (admin)',
            operationId: 'updateProduct',
            params: productParamsSchema,
            body: updateProductSchema,
            response: { 200: productRawSchema },
        },
        preHandler: [app.authenticate],
        handler: updateProductHandler,
    });

    app.delete('/admin/products/:id', {
        schema: {
            tags: ['Products'],
            summary: 'Arquivar produto (admin)',
            operationId: 'archiveProduct',
            params: productParamsSchema,
            response: { 200: productRawSchema },
        },
        preHandler: [app.authenticate],
        handler: archiveProductHandler,
    });

    app.post('/admin/products/:id/variants', {
        schema: {
            tags: ['Products'],
            summary: 'Adicionar variante (admin)',
            operationId: 'createVariant',
            params: productParamsSchema,
            body: createVariantSchema,
            response: { 201: variantRawSchema },
        },
        preHandler: [app.authenticate],
        handler: createVariantHandler,
    });

    app.patch('/admin/products/:id/variants/:vid', {
        schema: {
            tags: ['Products'],
            summary: 'Atualizar variante (admin)',
            operationId: 'updateVariant',
            params: variantParamsSchema,
            body: updateVariantSchema,
            response: { 200: variantRawSchema },
        },
        preHandler: [app.authenticate],
        handler: updateVariantHandler,
    });

    app.post('/admin/products/:id/images/presign', {
        schema: {
            tags: ['Products'],
            summary: 'Gerar assinatura Cloudinary (admin)',
            operationId: 'presignProductImage',
            params: productParamsSchema,
            response: {
                200: z.object({
                    signature: z.string(),
                    timestamp: z.number(),
                    folder: z.string(),
                    publicId: z.string().optional(),
                    cloudName: z.string(),
                    apiKey: z.string(),
                }),
            },
        },
        preHandler: [app.authenticate],
        handler: presignImageHandler,
    });

    app.post('/admin/products/:id/images', {
        schema: {
            tags: ['Products'],
            summary: 'Confirmar imagem após upload (admin)',
            operationId: 'confirmProductImage',
            params: productParamsSchema,
            body: confirmProductImageSchema,
            response: { 201: imageRawSchema },
        },
        preHandler: [app.authenticate],
        handler: confirmImageHandler,
    });

    app.patch('/admin/products/:id/images/:iid', {
        schema: {
            tags: ['Products'],
            summary: 'Atualizar imagem (admin)',
            operationId: 'updateProductImage',
            params: imageParamsSchema,
            body: updateProductImageSchema,
            response: { 200: imageRawSchema },
        },
        preHandler: [app.authenticate],
        handler: updateImageHandler,
    });

    app.delete('/admin/products/:id/images/:iid', {
        schema: {
            tags: ['Products'],
            summary: 'Remover imagem (admin)',
            operationId: 'deleteProductImage',
            params: imageParamsSchema,
            response: { 200: z.object({ deleted: z.boolean() }) },
        },
        preHandler: [app.authenticate],
        handler: deleteImageHandler,
    });

    app.post('/admin/products/:id/images/reorder', {
        schema: {
            tags: ['Products'],
            summary: 'Reordenar galeria (admin)',
            operationId: 'reorderProductImages',
            params: productParamsSchema,
            body: reorderImagesSchema,
            response: { 200: z.object({ reordered: z.boolean() }) },
        },
        preHandler: [app.authenticate],
        handler: reorderImagesHandler,
    });
};
