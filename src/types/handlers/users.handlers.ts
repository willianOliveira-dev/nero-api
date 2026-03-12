import type { ZodHandler } from '@/types/handlers/root.handler';
import type { UpdateProfileInput } from '../../modules/users/validations/users.validation';

export type GetMeHandler = ZodHandler;

export type UpdateMeHandler = ZodHandler<
  unknown,
  UpdateProfileInput
>;

export type PresignAvatarHandler = ZodHandler;

export type ConfirmAvatarHandler = ZodHandler<
  unknown,
  { avatarUrl: string }
>;

export type RemoveAvatarHandler = ZodHandler;