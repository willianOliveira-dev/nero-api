import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
    createHomeSectionHandler,
    deleteHomeSectionHandler,
    getHomeHandler,
    getHomeSectionHandler,
    listHomeSectionsHandler,
    reorderHomeSectionsHandler,
    updateHomeSectionHandler,
} from '../handlers/home.handlers';
import {
    createHomeSectionSchema,
    homeSectionParamsSchema,
    homeSectionSlugParamsSchema,
    reorderHomeSectionsSchema,
    updateHomeSectionSchema,
    getHomeQuerySchema,
} from '../validations/home.validation';

const priceOutputSchema = z.object({
    cents: z.number(),
    value: z.number(),
    formatted: z.string(),
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
    userContext: z.object({ isWishlisted: z.boolean() }).optional(),
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
            querystring: getHomeQuerySchema,
            response: { 200: z.array(homeSectionSchema) },
        },
        preHandler: [app.optionalAuthenticate],
        handler: getHomeHandler,
    });

    app.get('/home/:slug', {
        schema: {
            tags: ['Home'],
            summary: 'Retornar seção específica por slug',
            operationId: 'getHomeSection',
            params: homeSectionSlugParamsSchema,
            response: { 200: homeSectionSchema },
        },
        preHandler: [app.optionalAuthenticate],
        handler: getHomeSectionHandler,
    });

    app.get('/admin/home', {
        schema: {
            tags: ['Home'],
            summary: 'Listar todas as seções (admin)',
            operationId: 'listHomeSections',
            response: { 200: z.array(adminSectionSchema) },
        },
        preHandler: [app.authenticate],
        handler: listHomeSectionsHandler,
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
        handler: createHomeSectionHandler,
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
        handler: updateHomeSectionHandler,
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
        handler: deleteHomeSectionHandler,
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
        handler: reorderHomeSectionsHandler,
    });
};
