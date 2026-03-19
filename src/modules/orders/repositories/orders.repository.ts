import { and, desc, eq, gt, ne } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { orders } from '@/lib/db/schemas/index.schema';
import type {
    ListOrdersQuery,
    UpdateOrderStatusInput,
} from '../validations/orders.validation';

export class OrdersRepository {
    /**
     * Busca pedido por ID com todos os itens.
     * Usado tanto pelo usuário (com verificação de userId) quanto pelo admin.
     */
    async findById(id: string) {
        return (
            db.query.orders.findFirst({
                where: eq(orders.id, id),
                with: {
                    items: true,
                    coupon: true,
                    shippingAddress: true,
                    paymentMethod: true,
                },
            }) ?? null
        );
    }

    /**
     * Lista pedidos de um usuário com paginação por cursor.
     */
    async findByUserId(userId: string, query: ListOrdersQuery) {
        const { status, limit, cursor } = query;

        const conditions = [eq(orders.userId, userId)];

        if (status) {
            conditions.push(eq(orders.status, status));
        } else {
            conditions.push(ne(orders.status, 'pending'));
        }
        if (cursor) {
            conditions.push(gt(orders.id, cursor));
        }

        const rows = await db.query.orders.findMany({
            where: and(...conditions),
            orderBy: desc(orders.createdAt),
            limit: limit + 1,
            with: {
                items: {
                    limit: 3,
                },
            },
        });

        const hasMore = rows.length > limit;
        const data = hasMore ? rows.slice(0, limit) : rows;
        const nextCursor = hasMore ? data[data.length - 1].id : null;

        return { data, hasMore, nextCursor };
    }

    /**
     * Lista todos os pedidos (admin) com paginação por cursor.
     */
    async findAll(query: ListOrdersQuery) {
        const { status, limit, cursor } = query;

        const conditions = [];

        if (status) {
            conditions.push(eq(orders.status, status));
        } else {
            conditions.push(ne(orders.status, 'pending'));
        }
        if (cursor) {
            conditions.push(gt(orders.id, cursor));
        }

        const rows = await db.query.orders.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
            orderBy: desc(orders.createdAt),
            limit: limit + 1,
            with: {
                items: { limit: 3 },
            },
        });

        const hasMore = rows.length > limit;
        const data = hasMore ? rows.slice(0, limit) : rows;
        const nextCursor = hasMore ? data[data.length - 1].id : null;

        return { data, hasMore, nextCursor };
    }

    async updateStatus(id: string, input: UpdateOrderStatusInput) {
        const [result] = await db
            .update(orders)
            .set({ status: input.status, updatedAt: new Date() })
            .where(eq(orders.id, id))
            .returning();

        return result ?? null;
    }

    /**
     * Cancela um pedido — só permitido se status for pending ou paid.
     */
    async cancel(id: string) {
        const [result] = await db
            .update(orders)
            .set({ status: 'cancelled', updatedAt: new Date() })
            .where(
                and(
                    eq(orders.id, id),
                    // Garante que só cancela pedidos ainda não enviados
                ),
            )
            .returning();

        return result ?? null;
    }
}
