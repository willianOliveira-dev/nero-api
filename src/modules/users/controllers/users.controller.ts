import type {
    ConfirmAvatarHandler,
    GetMeHandler,
    PresignAvatarHandler,
    RemoveAvatarHandler,
    UpdateMeHandler,
} from '../../../types/handlers/users.handlers';
import { UsersService } from '../services/users.service';

const usersService = new UsersService();

export class UsersController {
    getMe: GetMeHandler = async (request, reply) => {
        const { user } = request.session;

        const profile = await usersService.getMe({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
        });

        return reply.status(200).send(profile);
    };

    updateMe: UpdateMeHandler = async (request, reply) => {
        const { user } = request.session;

        const updated = await usersService.updateMe(user.id, request.body);

        return reply.status(200).send(updated);
    };

    presignAvatar: PresignAvatarHandler = async (request, reply) => {
        const { user } = request.session;

        const result = await usersService.getAvatarUploadSignature(user.id);

        return reply.status(200).send(result);
    };

    confirmAvatar: ConfirmAvatarHandler = async (request, reply) => {
        const { user } = request.session;

        const result = await usersService.confirmAvatar(
            user.id,
            request.body.avatarUrl,
        );

        return reply.status(200).send(result);
    };

    removeAvatar: RemoveAvatarHandler = async (request, reply) => {
        const { user } = request.session;

        const result = await usersService.removeAvatar(user.id);

        return reply.status(200).send(result);
    };
}
