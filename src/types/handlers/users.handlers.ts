import type { RouteHandler } from 'fastify';
import type { UpdateProfileInput } from '../../modules/users/validations/users.validation';

export type GetMeHandler = RouteHandler;

export type UpdateMeHandler = RouteHandler<{
    Body: UpdateProfileInput;
}>;

export type PresignAvatarHandler = RouteHandler;

export type ConfirmAvatarHandler = RouteHandler<{
    Body: {
        avatarUrl: string;
    };
}>;

export type RemoveAvatarHandler = RouteHandler;
