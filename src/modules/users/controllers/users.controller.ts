/**
 * users.controller.ts
 * Recebe a requisição, chama o service e devolve a resposta.
 * Sem lógica de negócio aqui — apenas orquestração HTTP.
 */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { UsersService } from '../services/users.service';
import type { UpdateProfileInput } from '../validations/users.validation';

const usersService = new UsersService();

export class UsersController {
    /**
     * GET /v1/me
     * Retorna o perfil completo do usuário autenticado.
     */
    async getMe(request: FastifyRequest, reply: FastifyReply) {
        const { user } = request.session;

        const profile = await usersService.getMe({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
        });

        return reply.status(200).send({ data: profile });
    }

    /**
     * PATCH /v1/me
     * Atualiza nome, telefone ou preferência de gênero.
     */
    async updateMe(
        request: FastifyRequest<{ Body: UpdateProfileInput }>,
        reply: FastifyReply,
    ) {
        const { user } = request.session;

        const updated = await usersService.updateMe(user.id, request.body);

        return reply.status(200).send({ data: updated });
    }

    /**
     * POST /v1/me/avatar/presign
     * Gera assinatura para upload direto ao Cloudinary pelo app mobile.
     * Fluxo:
     *   1. App chama este endpoint → recebe { signature, timestamp, apiKey, ... }
     *   2. App faz upload direto ao Cloudinary usando a assinatura
     *   3. App chama PATCH /v1/me/avatar/confirm com a URL retornada pelo Cloudinary
     */
    async presignAvatar(request: FastifyRequest, reply: FastifyReply) {
        const { user } = request.session;

        const result = await usersService.getAvatarUploadSignature(user.id);

        return reply.status(200).send({ data: result });
    }

    /**
     * PATCH /v1/me/avatar/confirm
     * Confirma o avatar após o upload ser concluído pelo app.
     */
    async confirmAvatar(
        request: FastifyRequest<{ Body: { avatarUrl: string } }>,
        reply: FastifyReply,
    ) {
        const { user } = request.session;
        const { avatarUrl } = request.body;

        const result = await usersService.confirmAvatar(user.id, avatarUrl);

        return reply.status(200).send({ data: result });
    }

    /**
     * DELETE /v1/me/avatar
     * Remove o avatar e volta ao padrão (null).
     */
    async removeAvatar(request: FastifyRequest, reply: FastifyReply) {
        const { user } = request.session;

        const result = await usersService.removeAvatar(user.id);

        return reply.status(200).send({ data: result });
    }
}
