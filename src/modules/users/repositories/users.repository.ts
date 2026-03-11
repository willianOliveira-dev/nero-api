import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { userProfiles } from '@/lib/db/schemas/index.schema';
import type { UpdateProfileInput } from '../validations/users.validation';

export class UsersRepository {
    /**
     * Busca o profile pelo userId (Better Auth user.id).
     * Retorna null se o usuário ainda não tiver profile criado.
     */
    async findByUserId(userId: string) {
        const result = await db.query.userProfiles.findFirst({
            where: eq(userProfiles.userId, userId),
        });
        return result ?? null;
    }

    /**
     * Cria um novo profile para o usuário.
     * Chamado automaticamente no primeiro GET /v1/me
     * caso ainda não exista (lazy creation).
     */
    async create(userId: string) {
        const result = await db
            .insert(userProfiles)
            .values({ userId })
            .returning();

        return result[0];
    }

    /**
     * Atualiza os campos editáveis do profile.
     * Apenas os campos presentes no input são atualizados.
     */
    async update(userId: string, input: UpdateProfileInput) {
        const result = await db
            .update(userProfiles)
            .set({
                ...input,
                updatedAt: new Date(),
            })
            .where(eq(userProfiles.userId, userId))
            .returning();

        return result[0] ?? null;
    }

    /**
     * Atualiza apenas a URL do avatar.
     * Separado do update geral pois vem de um fluxo diferente
     * (upload → Cloudinary → salvar URL).
     */
    async updateAvatar(userId: string, avatarUrl: string | null) {
        const result = await db
            .update(userProfiles)
            .set({ avatarUrl, updatedAt: new Date() })
            .where(eq(userProfiles.userId, userId))
            .returning();

        return result[0] ?? null;
    }

    /**
     * Salva o Stripe Customer ID após criação no primeiro checkout.
     */
    async updateStripeCustomerId(userId: string, stripeCustomerId: string) {
        const result = await db
            .update(userProfiles)
            .set({ stripeCustomerId, updatedAt: new Date() })
            .where(eq(userProfiles.userId, userId))
            .returning();

        return result[0] ?? null;
    }
}
