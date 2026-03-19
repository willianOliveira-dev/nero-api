import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import {
    confirmAvatarHandler,
    getMeHandler,
    presignAvatarHandler,
    removeAvatarHandler,
    updateMeHandler,
} from '../handlers/users.handlers';
import { updateProfileSchema } from '../validations/users.validation';

export const usersRoutes: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preHandler', app.authenticate);

 
    app.get('/me', {
        schema: {
            tags: ['Users'],
            summary: 'Perfil do usuário autenticado',
            operationId: 'getMe',
            response: {
                200: z.object({
                    id: z.string(),
                    name: z.string(),
                    email: z.string().email(),
                    avatarUrl: z.string().url().nullable(),
                    phone: z.string().nullable(),
                    genderPreference: z
                        .enum(['men', 'women', 'kids', 'unisex'])
                        .nullable(),
                    createdAt: z.date(),
                }),
            },
        },
        handler: getMeHandler,
    });

    app.patch('/me', {
        schema: {
            tags: ['Users'],
            summary: 'Atualizar perfil',
            operationId: 'updateMe',
            body: updateProfileSchema,
            response: {
                200: z.object({
                    id: z.string(),
                    phone: z.string().nullable(),
                    genderPreference: z
                        .enum(['men', 'women', 'kids', 'unisex'])
                        .nullable(),
                    updatedAt: z.date(),
                }),
            },
        },
        handler: updateMeHandler,
    });

    app.post('/me/avatar/presign', {
        schema: {
            tags: ['Users'],
            summary: 'Gerar assinatura para upload direto ao Cloudinary',
            operationId: 'presignAvatar',
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
        handler: presignAvatarHandler,
    });

    app.patch('/me/avatar/confirm', {
        schema: {
            tags: ['Users'],
            summary: 'Confirmar avatar após upload',
            operationId: 'confirmAvatar',
            body: z.object({
                avatarUrl: z.string().url('URL do avatar inválida.'),
            }),
            response: {
                200: z.object({
                    avatarUrl: z.string().url().nullable(),
                }),
            },
        },
        handler: confirmAvatarHandler,
    });

    app.delete('/me/avatar', {
        schema: {
            tags: ['Users'],
            summary: 'Remover avatar',
            operationId: 'removeAvatar',
            response: {
                200: z.object({
                    avatarUrl: z.null(),
                }),
            },
        },
        handler: removeAvatarHandler,
    });
};
