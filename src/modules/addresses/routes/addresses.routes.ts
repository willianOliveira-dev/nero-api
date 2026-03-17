import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
    createAddressHandler,
    deleteAddressHandler,
    getDefaultAddressHandler,
    listAddressesHandler,
    setDefaultAddressHandler,
    updateAddressHandler,
} from '../handlers/addresses.handlers';
import {
    addressParamsSchema,
    createAddressSchema,
    updateAddressSchema,
} from '../validations/addresses.validation';

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
                200: z.array(addressResponseSchema),
            },
        },
        handler: listAddressesHandler,
    });

    app.get('/me/addresses/default', {
        schema: {
            tags: ['Addresses'],
            summary: 'Retornar endereço padrão',
            operationId: 'getDefaultAddress',
            response: {
                200: addressResponseSchema,
            },
        },
        handler: getDefaultAddressHandler,
    });

    app.post('/me/addresses', {
        schema: {
            tags: ['Addresses'],
            summary: 'Cadastrar novo endereço',
            operationId: 'createAddress',
            body: createAddressSchema,
            response: {
                201: addressResponseSchema,
            },
        },
        handler: createAddressHandler,
    });

    app.patch('/me/addresses/:id', {
        schema: {
            tags: ['Addresses'],
            summary: 'Atualizar endereço',
            operationId: 'updateAddress',
            params: addressParamsSchema,
            body: updateAddressSchema,
            response: {
                200: addressResponseSchema,
            },
        },
        handler: updateAddressHandler,
    });

    app.patch('/me/addresses/:id/default', {
        schema: {
            tags: ['Addresses'],
            summary: 'Definir endereço como padrão',
            operationId: 'setDefaultAddress',
            params: addressParamsSchema,
            response: {
                200: addressResponseSchema,
            },
        },
        handler: setDefaultAddressHandler,
    });

    app.delete('/me/addresses/:id', {
        schema: {
            tags: ['Addresses'],
            summary: 'Remover endereço',
            operationId: 'deleteAddress',
            params: addressParamsSchema,
            response: {
                200: z.object({ deleted: z.boolean() }),
            },
        },
        handler: deleteAddressHandler,
    });
};
