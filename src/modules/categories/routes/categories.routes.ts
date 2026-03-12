import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { CategoriesController } from '../controllers/categories.controller';
import {
    categoryParamsSchema,
    categorySlugParamsSchema,
    createCategorySchema,
    reorderCategoriesSchema,
    updateCategorySchema,
} from '../validations/categories.validation';

const controller = new CategoriesController();

const categoryResponseSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    parentId: z.string().uuid().nullable(),
    iconUrl: z.string().url().nullable(),
    imageUrl: z.string().url().nullable(),
    sizeGuideUrl: z.string().url().nullable(),
    sortOrder: z.number(),
    isActive: z.boolean(),
    subcategories: z
        .array(
            z.object({
                id: z.string().uuid(),
                name: z.string(),
                slug: z.string(),
                iconUrl: z.string().url().nullable(),
                sortOrder: z.number(),
                isActive: z.boolean(),
            }),
        )
        .optional(),
});

export const categoriesRoutes: FastifyPluginAsyncZod = async (app) => {

    // ── Rotas públicas ──────────────────────────────────────────
    
    app.get('/categories', {
        schema: {
            tags: ['Categories'],
            summary: 'Listar categorias ativas com subcategorias',
            operationId: 'listCategories',
            response: {
                200: z.array(categoryResponseSchema),
            },
        },
        handler: controller.list,
    });

    app.get('/categories/:slug', {
        schema: {
            tags: ['Categories'],
            summary: 'Detalhe da categoria por slug',
            operationId: 'getCategoryBySlug',
            params: categorySlugParamsSchema,
            response: { 200: categoryResponseSchema },
        },
        handler: controller.getBySlug,
    });

    // ── Rotas admin ─────────────────────────────────────────────
    app.post('/admin/categories', {
        schema: {
            tags: ['Categories'],
            summary: 'Criar categoria (admin)',
            operationId: 'createCategory',
            body: createCategorySchema,
            response: { 201: categoryResponseSchema },
        },
        preHandler: [app.authenticate],
        handler: controller.create,
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
        preHandler: [app.authenticate],
        handler: controller.update,
    });

    app.delete('/admin/categories/:id', {
        schema: {
            tags: ['Categories'],
            summary: 'Desativar categoria (admin)',
            operationId: 'deactivateCategory',
            params: categoryParamsSchema,
            response: { 200: categoryResponseSchema },
        } as const,
        preHandler: [app.authenticate],
        handler: controller.deactivate,
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
        preHandler: [app.authenticate],
        handler: controller.reorder,
    });
};
