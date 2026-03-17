import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
    createBrandHandler,
    deleteBrandHandler,
    getBrandBySlugHandler,
    listBrandsHandler,
    presignLogoHandler,
    updateBrandHandler,
} from '../handlers/brands.handlers';
import {
    brandParamsSchema,
    brandSlugParamsSchema,
    createBrandSchema,
    updateBrandSchema,
} from '../validations/brands.validation';

const brandSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    logoUrl: z.string().url().nullable(),
    isActive: z.boolean(),
    createdAt: z.date(),
});

export const brandsRoutes: FastifyPluginAsyncZod = async (app) => {
    app.get('/brands', {
        schema: {
            tags: ['Brands'],
            summary: 'Listar marcas ativas',
            operationId: 'listBrands',
            response: { 200: z.object({ data: z.array(brandSchema) }) },
        },
        handler: listBrandsHandler,
    });

    app.get('/brands/:slug', {
        schema: {
            tags: ['Brands'],
            summary: 'Detalhe da marca por slug',
            operationId: 'getBrand',
            params: brandSlugParamsSchema,
            response: { 200: z.object({ data: brandSchema }) },
        },
        handler: getBrandBySlugHandler,
    });

    app.post('/admin/brands', {
        schema: {
            tags: ['Brands'],
            summary: 'Criar marca (admin)',
            operationId: 'createBrand',
            body: createBrandSchema,
            response: { 201: z.object({ data: brandSchema }) },
        },
        preHandler: [app.authenticate],
        handler: createBrandHandler,
    });

    app.patch('/admin/brands/:id', {
        schema: {
            tags: ['Brands'],
            summary: 'Atualizar marca (admin)',
            operationId: 'updateBrand',
            params: brandParamsSchema,
            body: updateBrandSchema,
            response: { 200: z.object({ data: brandSchema }) },
        },
        preHandler: [app.authenticate],
        handler: updateBrandHandler,
    });

    app.delete('/admin/brands/:id', {
        schema: {
            tags: ['Brands'],
            summary: 'Desativar marca — soft delete (admin)',
            operationId: 'deleteBrand',
            params: brandParamsSchema,
            response: { 200: z.object({ data: brandSchema }) },
        },
        preHandler: [app.authenticate],
        handler: deleteBrandHandler,
    });

    app.post('/admin/brands/logo/presign', {
        schema: {
            tags: ['Brands'],
            summary: 'Gerar assinatura para upload de logo (admin)',
            operationId: 'presignBrandLogo',
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
        preHandler: [app.authenticate],
        handler: presignLogoHandler,
    });
};
