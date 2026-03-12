/**
 * addresses.service.ts
 * Regras de negócio do módulo de endereços.
 */

import { db } from '@/lib/db/connection';
import { ConflictError, NotFoundError } from '@/shared/errors/app.error';
import { AddressesRepository } from '../repositories/addresses.repository';
import type {
    CreateAddressInput,
    UpdateAddressInput,
} from '../validations/addresses.validation';

const addressesRepository = new AddressesRepository();

export class AddressesService {
    /**
     * Lista todos os endereços do usuário.
     */
    async listAddresses(userId: string) {
        return addressesRepository.findAllByUserId(userId);
    }

    /**
     * Retorna o endereço padrão do usuário.
     */
    async getDefault(userId: string) {
        const address = await addressesRepository.findDefault(userId);

        if (!address) {
            throw new NotFoundError('Nenhum endereço padrão encontrado.');
        }

        return address;
    }

    /**
     * Cria um novo endereço.
     *
     * Regras:
     *   - Se for o primeiro endereço do usuário, vira padrão automaticamente.
     *   - Se isDefault = true for passado explicitamente, executa a troca em
     *     transaction (limpa os outros e seta o novo).
     */
    async createAddress(userId: string, input: CreateAddressInput) {
        const count = await addressesRepository.countByUserId(userId);

        const isDefault = count === 0;

        if (isDefault) {
            return addressesRepository.create(userId, {
                ...input,
                isDefault: true,
            });
        }

        return addressesRepository.create(userId, {
            ...input,
            isDefault: false,
        });
    }

    /**
     * Atualiza os campos de um endereço existente.
     */
    async updateAddress(id: string, userId: string, input: UpdateAddressInput) {
        const existing = await addressesRepository.findByIdAndUserId(
            id,
            userId,
        );

        if (!existing) {
            throw new NotFoundError('Endereço não encontrado.');
        }

        const updated = await addressesRepository.update(id, userId, input);

        if (!updated) {
            throw new NotFoundError('Endereço não encontrado.');
        }

        return updated;
    }

    /**
     * Define um endereço como padrão.
     *
     * Executado em transaction para garantir atomicidade:
     *   1. Remove isDefault de todos os endereços do usuário
     *   2. Seta isDefault = true no endereço escolhido
     *
     * Se o endereço já for o padrão, retorna sem fazer nada.
     */
    async setDefault(id: string, userId: string) {
        const existing = await addressesRepository.findByIdAndUserId(
            id,
            userId,
        );

        if (!existing) {
            throw new NotFoundError('Endereço não encontrado.');
        }

        if (existing.isDefault) {
            return existing;
        }

        return db.transaction(async (_tx) => {
            const txRepo = new AddressesRepository();

            await txRepo.clearDefault(userId);
            const updated = await txRepo.setDefault(id, userId);

            if (!updated) {
                throw new NotFoundError('Endereço não encontrado.');
            }

            return updated;
        });
    }

    /**
     * Remove um endereço.
     *
     * Regras:
     *   - Não permite deletar o endereço padrão se for o único.
     *   - Se deletar o padrão e houver outros, promove o mais antigo.
     */
    async deleteAddress(id: string, userId: string) {
        const existing = await addressesRepository.findByIdAndUserId(
            id,
            userId,
        );

        if (!existing) {
            throw new NotFoundError('Endereço não encontrado.');
        }

        const count = await addressesRepository.countByUserId(userId);

        if (existing.isDefault && count === 1) {
            throw new ConflictError(
                'Não é possível remover o único endereço padrão. Adicione outro endereço primeiro.',
            );
        }

        await db.transaction(async () => {
            await addressesRepository.delete(id, userId);

            if (existing.isDefault) {
                const remaining = await addressesRepository.findAllByUserId(
                    userId,
                );
                if (remaining.length > 0) {
                    await addressesRepository.clearDefault(userId);
                    await addressesRepository.setDefault(
                        remaining[0].id,
                        userId,
                    );
                }
            }
        });

        return { deleted: true };
    }
}
