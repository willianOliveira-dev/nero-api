import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ProductsController } from '../controllers/products.controller';
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

const controller = new ProductsController();

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
const variantSchema = z.object({
    id: z.string().uuid(),
    productId: z.string().uuid(),
    sku: z.string(),
    price: priceOutputSchema.nullable(),
    stock: z.number(),
    attributes: z.record(z.string(), z.string()),
    isActive: z.boolean(),
});

const imageSchema = z.object({
    id: z.string().uuid(),
    productId: z.string().uuid(),
    variantId: z.string().uuid().nullable(),
    url: z.string().url(),
    altText: z.string().nullable(),
    position: z.number(),
    isPrimary: z.boolean(),
});

const productSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable(),
    price: productPriceSchema,
    gender: z.enum(['men', 'women', 'kids', 'unisex']),
    status: z.enum(['draft', 'active', 'archived']),
    freeShipping: z.boolean(),
    isFeatured: z.boolean(),
    soldCount: z.number(),
    ratingAvg: z.number().nullable(),
    ratingCount: z.number(),
    categoryId: z.string().uuid().nullable(),
    category: z.unknown().nullable(),
    variants: z.array(variantSchema).optional(),
    images: z.array(imageSchema).optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export const productsRoutes: FastifyPluginAsyncZod = async (app) => {
    
    // ── Rotas públicas ──────────────────────────────────────────

    app.get('/products/search', {
        schema: {
            tags: ['Products'],
            summary: 'Busca com filtros e full-text search',
            operationId: 'searchProducts',
            querystring: searchProductsSchema,
            response: {
                200: z.object({
                    data: z.array(productSchema),
                    meta: z.object({
                        total: z.number(),
                        nextCursor: z.string().uuid().nullable(),
                        hasMore: z.boolean(),
                        limit: z.number(),
                    }),
                }),
            },
        },
        handler: controller.search,
    });

    app.get('/products/slug/:slug', {
        schema: {
            tags: ['Products'],
            summary: 'Produto por slug (canonical URL)',
            operationId: 'getProductBySlug',
            params: productSlugParamsSchema,
            response: { 200: z.object({ data: productSchema }) },
        },
        handler: controller.getBySlug,
    });

    app.get('/products/:id', {
        schema: {
            tags: ['Products'],
            summary: 'Detalhe do produto com variantes e imagens',
            operationId: 'getProductById',
            params: productParamsSchema,
            response: { 200: z.object({ data: productSchema }) },
        },
        handler: controller.getById,
    });

    app.get('/products/:id/variants', {
        schema: {
            tags: ['Products'],
            summary: 'Listar variantes do produto',
            operationId: 'listProductVariants',
            params: productParamsSchema,
            response: { 200: z.object({ data: z.array(variantSchema) }) },
        },
        handler: controller.listVariants,
    });

    app.get('/products/:id/images', {
        schema: {
            tags: ['Products'],
            summary: 'Listar galeria de imagens',
            operationId: 'listProductImages',
            params: productParamsSchema,
            response: { 200: z.object({ data: z.array(imageSchema) }) },
        },
        handler: controller.listImages,
    });

    // ── Rotas admin ─────────────────────────────────────────────

    app.post('/admin/products', {
        schema: {
            tags: ['Products'],
            summary: 'Criar produto (admin)',
            operationId: 'createProduct',
            body: createProductSchema,
            response: { 201: z.object({ data: productSchema }) },
        },
        preHandler: [app.authenticate],
        handler: controller.create,
    });

    app.patch('/admin/products/:id', {
        schema: {
            tags: ['Products'],
            summary: 'Atualizar produto (admin)',
            operationId: 'updateProduct',
            params: productParamsSchema,
            body: updateProductSchema,
            response: { 200: z.object({ data: productSchema }) },
        },
        preHandler: [app.authenticate],
        handler: controller.update,
    });

    app.delete('/admin/products/:id', {
        schema: {
            tags: ['Products'],
            summary: 'Arquivar produto — soft delete (admin)',
            operationId: 'archiveProduct',
            params: productParamsSchema,
            response: { 200: z.object({ data: productSchema }) },
        },
        preHandler: [app.authenticate],
        handler: controller.archive,
    });

    app.post('/admin/products/:id/variants', {
        schema: {
            tags: ['Products'],
            summary: 'Adicionar variante (admin)',
            operationId: 'createVariant',
            params: productParamsSchema,
            body: createVariantSchema,
            response: { 201: z.object({ data: variantSchema }) },
        },
        preHandler: [app.authenticate],
        handler: controller.createVariant,
    });

    app.patch('/admin/products/:id/variants/:vid', {
        schema: {
            tags: ['Products'],
            summary: 'Atualizar variante (admin)',
            operationId: 'updateVariant',
            params: variantParamsSchema,
            body: updateVariantSchema,
            response: { 200: z.object({ data: variantSchema }) },
        },
        preHandler: [app.authenticate],
        handler: controller.updateVariant,
    });

    app.post('/admin/products/:id/images/presign', {
        schema: {
            tags: ['Products'],
            summary: 'Gerar assinatura Cloudinary para imagem (admin)',
            operationId: 'presignProductImage',
            params: productParamsSchema,
            response: {
                200: z.object({
                    data: z.object({
                        signature: z.string(),
                        timestamp: z.number(),
                        folder: z.string(),
                        publicId: z.string().optional(),
                        cloudName: z.string(),
                        apiKey: z.string(),
                    }),
                }),
            },
        },
        preHandler: [app.authenticate],
        handler: controller.presignImage,
    });

    app.post('/admin/products/:id/images', {
        schema: {
            tags: ['Products'],
            summary: 'Confirmar imagem após upload no Cloudinary (admin)',
            operationId: 'confirmProductImage',
            params: productParamsSchema,
            body: confirmProductImageSchema,
            response: { 201: z.object({ data: imageSchema }) },
        },
        preHandler: [app.authenticate],
        handler: controller.confirmImage,
    });

    app.patch('/admin/products/:id/images/:iid', {
        schema: {
            tags: ['Products'],
            summary: 'Atualizar imagem (admin)',
            operationId: 'updateProductImage',
            params: imageParamsSchema,
            body: updateProductImageSchema,
            response: { 200: z.object({ data: imageSchema }) },
        },
        preHandler: [app.authenticate],
        handler: controller.updateImage,
    });

    app.delete('/admin/products/:id/images/:iid', {
        schema: {
            tags: ['Products'],
            summary: 'Remover imagem (admin)',
            operationId: 'deleteProductImage',
            params: imageParamsSchema,
            response: {
                200: z.object({ data: z.object({ deleted: z.boolean() }) }),
            },
        },
        preHandler: [app.authenticate],
        handler: controller.deleteImage,
    });

    app.post('/admin/products/:id/images/reorder', {
        schema: {
            tags: ['Products'],
            summary: 'Reordenar galeria (admin)',
            operationId: 'reorderProductImages',
            params: productParamsSchema,
            body: reorderImagesSchema,
            response: {
                200: z.object({
                    data: z.object({ reordered: z.boolean() }),
                }),
            },
        },
        preHandler: [app.authenticate],
        handler: controller.reorderImages,
    });
};
