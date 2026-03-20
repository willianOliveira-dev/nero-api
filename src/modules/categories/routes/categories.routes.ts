import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
    createCategoryHandler,
    deactivateCategoryHandler,
    getCategoryBySlugHandler,
    listCategoriesHandler,
    presignImageHandler,
    reorderCategoriesHandler,
    updateCategoryHandler,
} from '../handlers/categories.handlers';
import {
    categoryParamsSchema,
    categorySlugParamsSchema,
    createCategorySchema,
    reorderCategoriesSchema,
    updateCategorySchema,
} from '../validations/categories.validation';
const categoryResponseSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    parentId: z.string().uuid().nullish(),
    iconUrl: z.string().url().nullish(),
    imageUrl: z.string().url().nullish(),
    sortOrder: z.number(),
    isActive: z.boolean(),
    subcategories: z
        .array(
            z.object({
                id: z.string().uuid(),
                name: z.string(),
                slug: z.string(),
                iconUrl: z.string().url().nullish(),
                sortOrder: z.number(),
                isActive: z.boolean(),
            }),
        )
        .optional(),
});


export const categoriesRoutes: FastifyPluginAsyncZod = async (app) => {
	app.addHook('preHandler', app.authenticate);

    
    app.get('/categories', {
        schema: {
            tags: ['Categories'],
            summary: 'Listar categorias ativas com subcategorias',
            operationId: 'listCategories',
            response: {
                200: z.array(categoryResponseSchema),
            },
        },
        handler: listCategoriesHandler,
    });

    app.get('/categories/:slug', {
        schema: {
            tags: ['Categories'],
            summary: 'Detalhe da categoria por slug',
            operationId: 'getCategoryBySlug',
            params: categorySlugParamsSchema,
            response: { 200: categoryResponseSchema },
        },
        handler: getCategoryBySlugHandler,
    });


    app.post('/admin/categories', {
        schema: {
            tags: ['Categories'],
            summary: 'Criar categoria (admin)',
            operationId: 'createCategory',
            body: createCategorySchema,
            response: { 201: categoryResponseSchema },
        },
        
        handler: createCategoryHandler,
    });

    app.patch('/admin/categories/:id', {
        schema: {
            tags: ['Categories'],
            summary: 'Atualizar categoria (admin)',
            operationId: 'updateCategory',
            params: categoryParamsSchema,
            body: updateCategorySchema,
            response: { 200: categoryResponseSchema },
        } as const,
        
        handler: updateCategoryHandler,
    });

    app.delete('/admin/categories/:id', {
        schema: {
            tags: ['Categories'],
            summary: 'Desativar categoria (admin)',
            operationId: 'deactivateCategory',
            params: categoryParamsSchema,
            response: { 200: categoryResponseSchema },
        } as const,
        
        handler: deactivateCategoryHandler,
    });

    app.post('/admin/categories/reorder', {
        schema: {
            tags: ['Categories'],
            summary: 'Reordenar categorias (admin)',
            operationId: 'reorderCategories',
            body: reorderCategoriesSchema,
            response: {
                200: z.object({ reordered: z.boolean() }),
            },
        },
        
        handler: reorderCategoriesHandler,
    });

    app.post('/admin/categories/image/presign', {
        schema: {
            tags: ['Categories'],
            summary: 'Gerar assinatura para upload de imagem (admin)',
            operationId: 'presignCategoryImage',
            response: {
                200: z.object({
                    data: z.object({
                        signature: z.string(),
                        timestamp: z.number(),
                        folder: z.string(),
                        cloudName: z.string(),
                        apiKey: z.string(),
                    }),
                }),
            },
        },
        
        handler: presignImageHandler,
    });
};
