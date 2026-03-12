import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { AddressesController } from '../controllers/addresses.controller';
import {
    addressParamsSchema,
    createAddressSchema,
    updateAddressSchema,
} from '../validations/addresses.validation';

const controller = new AddressesController();

const addressResponseSchema = z.object({
    id: z.string().uuid(),
    userId: z.string(),
    label: z.string().nullable(),
    recipientName: z.string(),
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string(),
    complement: z.string().nullable(),
    isDefault: z.boolean(),
    createdAt: z.date(),
});

export const addressesRoutes: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preHandler', app.authenticate);

    app.get('/me/addresses', {
        schema: {
            tags: ['Addresses'],
            summary: 'Listar endereços do usuário',
            operationId: 'listAddresses',
            response: {
                200: z.object({ data: z.array(addressResponseSchema) }),
            },
        },
        handler: controller.list,
    });

    app.get('/me/addresses/default', {
        schema: {
            tags: ['Addresses'],
            summary: 'Retornar endereço padrão',
            operationId: 'getDefaultAddress',
            response: {
                200: z.object({ data: addressResponseSchema }),
            },
        },
        handler: controller.getDefault,
    });

    app.post('/me/addresses', {
        schema: {
            tags: ['Addresses'],
            summary: 'Cadastrar novo endereço',
            operationId: 'createAddress',
            body: createAddressSchema,
            response: {
                201: z.object({ data: addressResponseSchema }),
            },
        },
        handler: controller.create,
    });

    app.patch('/me/addresses/:id', {
        schema: {
            tags: ['Addresses'],
            summary: 'Atualizar endereço',
            operationId: 'updateAddress',
            params: addressParamsSchema,
            body: updateAddressSchema,
            response: {
                200: z.object({ data: addressResponseSchema }),
            },
        },
        handler: controller.update,
    });

    app.patch('/me/addresses/:id/default', {
        schema: {
            tags: ['Addresses'],
            summary: 'Definir endereço como padrão',
            operationId: 'setDefaultAddress',
            params: addressParamsSchema,
            response: {
                200: z.object({ data: addressResponseSchema }),
            },
        },
        handler: controller.setDefault,
    });

    app.delete('/me/addresses/:id', {
        schema: {
            tags: ['Addresses'],
            summary: 'Remover endereço',
            operationId: 'deleteAddress',
            params: addressParamsSchema,
            response: {
                200: z.object({ data: z.object({ deleted: z.boolean() }) }),
            },
        },
        handler: controller.delete,
    });
};
