import { UsersService } from '../services/users.service';
import type {
    ConfirmAvatarHandler,
    GetMeHandler,
    PresignAvatarHandler,
    RemoveAvatarHandler,
    UpdateMeHandler,
} from '../../../types/handlers/users.handlers';

const usersService = new UsersService();

export const getMeHandler: GetMeHandler = async (request, reply) => {
    const { user } = request.session;

    const profile = await usersService.getMe({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
    });

    return reply.status(200).send(profile);
};

export const updateMeHandler: UpdateMeHandler = async (request, reply) => {
    const { user } = request.session;
    const updated = await usersService.updateMe(user.id, request.body);
    return reply.status(200).send(updated);
};

export const presignAvatarHandler: PresignAvatarHandler = async (request, reply) => {
    const { user } = request.session;
    const result = await usersService.getAvatarUploadSignature(user.id);
    return reply.status(200).send(result);
};

export const confirmAvatarHandler: ConfirmAvatarHandler = async (request, reply) => {
    const { user } = request.session;
    const result = await usersService.confirmAvatar(
        user.id,
        request.body.avatarUrl,
    );
    return reply.status(200).send(result);
};

export const removeAvatarHandler: RemoveAvatarHandler = async (request, reply) => {
    const { user } = request.session;
    const result = await usersService.removeAvatar(user.id);
    return reply.status(200).send(result);
};
