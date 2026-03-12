import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { UsersController } from '../controllers/users.controller';
import { updateProfileSchema } from '../validations/users.validation';

const usersController = new UsersController();

export const usersRoutes: FastifyPluginAsyncZod = async (app) => {
    app.addHook('preHandler', app.authenticate);

    // ── GET /v1/me ──────────────────────────────────────────────
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
        handler: usersController.getMe,
    });

    // ── PATCH /v1/me ────────────────────────────────────────────
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
        handler: usersController.updateMe,
    });

    // ── POST /v1/me/avatar/presign ──────────────────────────────
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
        handler: usersController.presignAvatar,
    });

    // ── PATCH /v1/me/avatar/confirm ─────────────────────────────
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
        handler: usersController.confirmAvatar,
    });

    // ── DELETE /v1/me/avatar ────────────────────────────────────
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
        handler: usersController.removeAvatar,
    });
};
