import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { HomeController } from '../controllers/home.controller';
import {
    createHomeSectionSchema,
    homeSectionParamsSchema,
    homeSectionSlugParamsSchema,
    reorderHomeSectionsSchema,
    updateHomeSectionSchema,
} from '../validations/home.validation';

const controller = new HomeController();

const priceOutputSchema = z.object({
    cents: z.number(),
    value: z.number(),
    formatted: z.string(),
});

const productCardSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    price: z.object({
        current: priceOutputSchema,
        original: priceOutputSchema.nullable(),
        discountPercent: z.number().nullable(),
    }),
    freeShipping: z.boolean(),
    ratingAvg: z.number().nullable(),
    ratingCount: z.number(),
    soldCount: z.number(),
    imageUrl: z.string().url().nullable(),
});

const homeSectionSchema = z.object({
    id: z.string().uuid(),
    slug: z.string(),
    title: z.string(),
    type: z.enum([
        'top_selling',
        'new_in',
        'on_sale',
        'free_shipping',
        'by_gender',
        'category_list',
        'banner',
    ]),
    sortOrder: z.number(),
    isActive: z.boolean(),
    filterJson: z.record(z.string(), z.unknown()).nullable(),
    items: z.array(productCardSchema),
    updatedAt: z.date(),
});

const adminSectionSchema = z.object({
    id: z.string().uuid(),
    slug: z.string(),
    title: z.string(),
    type: z.enum([
        'top_selling',
        'new_in',
        'on_sale',
        'free_shipping',
        'by_gender',
        'category_list',
        'banner',
    ]),
    sortOrder: z.number(),
    isActive: z.boolean(),
    filterJson: z.record(z.string(), z.unknown()).nullable(),
    updatedAt: z.date(),
});

export const homeRoutes: FastifyPluginAsyncZod = async (app) => {
    app.get('/home', {
        schema: {
            tags: ['Home'],
            summary: 'Retornar todas as seções ativas da home com produtos',
            operationId: 'getHome',
            response: { 200: z.array(homeSectionSchema) },
        },
        handler: controller.getHome,
    });

    app.get('/home/:slug', {
        schema: {
            tags: ['Home'],
            summary: 'Retornar seção específica por slug',
            operationId: 'getHomeSection',
            params: homeSectionSlugParamsSchema,
            response: { 200: homeSectionSchema },
        },
        handler: controller.getSection,
    });

    app.get('/admin/home', {
        schema: {
            tags: ['Home'],
            summary: 'Listar todas as seções (admin)',
            operationId: 'listHomeSections',
            response: { 200: z.array(adminSectionSchema) },
        },
        preHandler: [app.authenticate],
        handler: controller.listAll,
    });

    app.post('/admin/home', {
        schema: {
            tags: ['Home'],
            summary: 'Criar seção (admin)',
            operationId: 'createHomeSection',
            body: createHomeSectionSchema,
            response: { 201: adminSectionSchema },
        },
        preHandler: [app.authenticate],
        handler: controller.create,
    });

    app.patch('/admin/home/:id', {
        schema: {
            tags: ['Home'],
            summary: 'Atualizar seção (admin)',
            operationId: 'updateHomeSection',
            params: homeSectionParamsSchema,
            body: updateHomeSectionSchema,
            response: { 200: adminSectionSchema },
        },
        preHandler: [app.authenticate],
        handler: controller.update,
    });

    app.delete('/admin/home/:id', {
        schema: {
            tags: ['Home'],
            summary: 'Remover seção (admin)',
            operationId: 'deleteHomeSection',
            params: homeSectionParamsSchema,
            response: { 200: z.object({ deleted: z.boolean() }) },
        },
        preHandler: [app.authenticate],
        handler: controller.delete,
    });

    app.post('/admin/home/reorder', {
        schema: {
            tags: ['Home'],
            summary: 'Reordenar seções (admin)',
            operationId: 'reorderHomeSections',
            body: reorderHomeSectionsSchema,
            response: { 200: z.object({ reordered: z.boolean() }) },
        },
        preHandler: [app.authenticate],
        handler: controller.reorder,
    });
};
