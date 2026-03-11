import { StorageService } from '@/modules/storage/services/storage.service';
import { NotFoundError } from '@/shared/errors/app.error';
import { UsersRepository } from '../repositories/users.repository';
import type { UpdateProfileInput } from '../validations/users.validation';

const usersRepository = new UsersRepository();
const storageService = new StorageService();

export class UsersService {
    /**
     * Retorna o perfil completo do usuário autenticado.
     * Se o profile ainda não existir, cria automaticamente
     */
    async getMe(user: {
        id: string;
        name: string;
        email: string;
        image?: string | null;
    }) {
        let profile = await usersRepository.findByUserId(user.id);

        if (!profile) {
            profile = await usersRepository.create(user.id);
        }

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            avatarUrl: profile.avatarUrl ?? user.image ?? null,
            phone: profile.phone,
            genderPreference: profile.genderPreference,
            createdAt: profile.createdAt,
        };
    }

    /**
     * Atualiza os campos editáveis do perfil.
     * name: atualiza tanto no user (Better Auth) quanto no profile.
     * phone e genderPreference: apenas no profile.
     */
    async updateMe(userId: string, input: UpdateProfileInput) {
        let profile = await usersRepository.findByUserId(userId);

        if (!profile) {
            await usersRepository.create(userId);
        }

        profile = await usersRepository.update(userId, input);

        if (!profile) {
            throw new NotFoundError('Perfil não encontrado.');
        }

        return profile;
    }

    /**
     * Gera assinatura para upload direto ao Cloudinary pelo app mobile.
     * O arquivo não passa pelo servidor — apenas a assinatura é gerada aqui.
     * Após o upload, o app chama PATCH /v1/me/avatar/confirm com a URL final.
     */
    async getAvatarUploadSignature(userId: string) {
        const publicId = `avatars/user_${userId}`;
        const signature = storageService.generateUploadSignature(
            'avatars',
            publicId,
        );

        return signature;
    }

    /**
     * Salva a URL pública do avatar após o upload ser confirmado pelo app.
     * Cloudinary sobrescreve o publicId automaticamente — não precisa deletar.
     */
    async confirmAvatar(userId: string, avatarUrl: string) {
        const updated = await usersRepository.updateAvatar(userId, avatarUrl);

        if (!updated) {
            throw new NotFoundError('Perfil não encontrado.');
        }

        return { avatarUrl: updated.avatarUrl };
    }

    /**
     * Remove o avatar do usuário.
     * Deleta do Cloudinary pelo publicId e seta avatarUrl = null.
     */
    async removeAvatar(userId: string) {
        const profile = await usersRepository.findByUserId(userId);

        if (profile?.avatarUrl) {
            const isCloudinaryUrl =
                profile.avatarUrl.includes('cloudinary.com');
            if (isCloudinaryUrl) {
                const publicId = storageService.extractPublicIdFromUrl(
                    profile.avatarUrl,
                );
                if (publicId) {
                    await storageService.deleteFile(publicId).catch(() => null);
                }
            }
        }

        await usersRepository.updateAvatar(userId, null);

        return { avatarUrl: null };
    }
}
