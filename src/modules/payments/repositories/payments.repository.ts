import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import {
    paymentMethods,
    type NewPaymentMethod,
} from '@/lib/db/schemas/index.schema';

export class PaymentsRepository {
    async create(data: NewPaymentMethod) {
        const [result] = await db
            .insert(paymentMethods)
            .values(data)
            .returning();
        return result;
    }

    async findByUserId(userId: string) {
        return db.query.paymentMethods.findMany({
            where: eq(paymentMethods.userId, userId),
            orderBy: (pm, { desc }) => [desc(pm.createdAt)],
        });
    }

    async findById(id: string) {
        return (
            db.query.paymentMethods.findFirst({
                where: eq(paymentMethods.id, id),
            }) ?? null
        );
    }

    async findByStripeSetupIntentId(setupIntentId: string) {
        return (
            db.query.paymentMethods.findFirst({
                where: eq(paymentMethods.stripeSetupIntentId, setupIntentId),
            }) ?? null
        );
    }

    async findByStripePaymentMethodId(stripePaymentMethodId: string) {
        return (
            db.query.paymentMethods.findFirst({
                where: eq(
                    paymentMethods.stripePaymentMethodId,
                    stripePaymentMethodId,
                ),
            }) ?? null
        );
    }

    async setDefault(userId: string, id: string) {
        await db
            .update(paymentMethods)
            .set({ isDefault: false, updatedAt: new Date() })
            .where(
                and(
                    eq(paymentMethods.userId, userId),
                    eq(paymentMethods.isDefault, true),
                ),
            );

        const [result] = await db
            .update(paymentMethods)
            .set({ isDefault: true, updatedAt: new Date() })
            .where(
                and(
                    eq(paymentMethods.id, id),
                    eq(paymentMethods.userId, userId),
                ),
            )
            .returning();

        return result ?? null;
    }

    async updateSetupIntentStatus(
        setupIntentId: string,
        status: 'pending' | 'succeeded' | 'cancelled',
    ) {
        const [result] = await db
            .update(paymentMethods)
            .set({ setupIntentStatus: status, updatedAt: new Date() })
            .where(eq(paymentMethods.stripeSetupIntentId, setupIntentId))
            .returning();

        return result ?? null;
    }

    async delete(id: string, userId: string) {
        const [result] = await db
            .delete(paymentMethods)
            .where(
                and(
                    eq(paymentMethods.id, id),
                    eq(paymentMethods.userId, userId),
                ),
            )
            .returning();

        return result ?? null;
    }
}
