import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { userAddresses } from '@/lib/db/schemas/index.schema';
import type {
    CreateAddressInput,
    UpdateAddressInput,
} from '../validations/addresses.validation';

export class AddressesRepository {
    /**
     * Lista todos os endereços do usuário.
     * Ordenado: padrão primeiro, depois por data de criação.
     */
    async findAllByUserId(userId: string) {
        return db.query.userAddresses.findMany({
            where: eq(userAddresses.userId, userId),
            orderBy: [userAddresses.isDefault, userAddresses.createdAt],
        });
    }

    /**
     * Busca um endereço pelo ID garantindo que pertence ao usuário.
     */
    async findByIdAndUserId(id: string, userId: string) {
        return (
            db.query.userAddresses.findFirst({
                where: and(
                    eq(userAddresses.id, id),
                    eq(userAddresses.userId, userId),
                ),
            }) ?? null
        );
    }

    /**
     * Busca o endereço padrão do usuário.
     */
    async findDefault(userId: string) {
        return (
            db.query.userAddresses.findFirst({
                where: and(
                    eq(userAddresses.userId, userId),
                    eq(userAddresses.isDefault, true),
                ),
            }) ?? null
        );
    }

    /**
     * Cria um novo endereço.
     */
    async create(
        userId: string,
        input: CreateAddressInput & { isDefault: boolean },
    ) {
        const result = await db
            .insert(userAddresses)
            .values({ ...input, userId })
            .returning();

        return result[0];
    }

    /**
     * Atualiza os campos de um endereço.
     */
    async update(id: string, userId: string, input: UpdateAddressInput) {
        const [result] = await db
            .update(userAddresses)
            .set(input)
            .where(
                and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)),
            )
            .returning();

        return result ?? null;
    }

    /**
     * Remove o isDefault de todos os endereços do usuário.
     * Chamado dentro de transaction antes de setar o novo padrão.
     */
    async clearDefault(userId: string) {
        await db
            .update(userAddresses)
            .set({ isDefault: false })
            .where(eq(userAddresses.userId, userId));
    }

    /**
     * Seta um endereço como padrão.
     * Sempre chamado após clearDefault() dentro de uma transaction.
     */
    async setDefault(id: string, userId: string) {
        const [result] = await db
            .update(userAddresses)
            .set({ isDefault: true })
            .where(
                and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)),
            )
            .returning();

        return result ?? null;
    }

    /**
     * Deleta um endereço.
     */
    async delete(id: string, userId: string) {
        const [result] = await db
            .delete(userAddresses)
            .where(
                and(eq(userAddresses.id, id), eq(userAddresses.userId, userId)),
            )
            .returning();

        return result ?? null;
    }

    /**
     * Conta quantos endereços o usuário possui.
     * Usado para decidir se o primeiro endereço vira padrão automaticamente.
     */
    async countByUserId(userId: string) {
        const result = await db.query.userAddresses.findMany({
            where: eq(userAddresses.userId, userId),
            columns: { id: true },
        });

        return result.length;
    }
}
