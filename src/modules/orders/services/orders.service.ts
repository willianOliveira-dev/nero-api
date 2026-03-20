import {
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from '@/shared/errors/app.error';
import { Price } from '@/shared/utils/price.util';
import { OrdersRepository } from '../repositories/orders.repository';
import type {
    ListOrdersQuery,
    UpdateOrderStatusInput,
} from '../validations/orders.validation';

import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/connection';
import { productReviews } from '@/lib/db/schemas/index.schema';
import type { ReviewMedia } from '@/lib/db/schemas/reviews-media.schema';
const ordersRepository = new OrdersRepository();

const CANCELLABLE_STATUSES = ['pending', 'paid'] as const;

type LoadedOrder = NonNullable<
    Awaited<ReturnType<OrdersRepository['findById']>>
>;
type OrderSummary = Awaited<
    ReturnType<OrdersRepository['findByUserId']>
>['data'][number];

type ReviewWithMedia = typeof productReviews.$inferSelect & {
    media: ReviewMedia[];
};

export class OrdersService {
    async listOrders(userId: string, query: ListOrdersQuery) {
        const result = await ordersRepository.findByUserId(userId, query);
        return {
            data: result.data.map(serializeOrderSummary),
            hasMore: result.hasMore,
            nextCursor: result.nextCursor,
        };
    }

    async getOrder(id: string, userId: string) {
        const order = await this.findOrFail(id);
        if (order.userId !== userId) {
            throw new ForbiddenError('Acesso negado.');
        }

        const reviews = await db.query.productReviews.findMany({
            where: and(
                eq(productReviews.orderId, id),
                eq(productReviews.userId, userId),
            ),
            with: { media: true }
        });

        const reviewMap = new Map();
        for (const r of reviews) {reviewMap.set(r.productId, r)};

        return serializeOrder(order, reviewMap);
    }

    async cancelOrder(id: string, userId: string) {
        const order = await this.findOrFail(id);
        if (order.userId !== userId) {
            throw new ForbiddenError('Acesso negado.');
        }

        if (
            !CANCELLABLE_STATUSES.includes(
                order.status as (typeof CANCELLABLE_STATUSES)[number],
            )
        ) {
            throw new ConflictError(
                'Este pedido não pode ser cancelado pois já foi enviado.',
            );
        }

        await ordersRepository.cancel(id);

        return serializeOrder(await this.findOrFail(id));
    }

    async listAllOrders(query: ListOrdersQuery) {
        const result = await ordersRepository.findAll(query);
        return {
            data: result.data.map(serializeOrderSummary),
            hasMore: result.hasMore,
            nextCursor: result.nextCursor,
        };
    }

    async updateOrderStatus(id: string, input: UpdateOrderStatusInput) {
        await this.findOrFail(id);
        await ordersRepository.updateStatus(id, input);
        return serializeOrder(await this.findOrFail(id));
    }

    private async findOrFail(id: string): Promise<LoadedOrder> {
        const order = await ordersRepository.findById(id);
        if (!order) {
            throw new NotFoundError('Pedido não encontrado.');
        }
        return order;
    }
}

function serializeOrder(order: LoadedOrder, reviewMap: Map<string, ReviewWithMedia> = new Map()) {
    return {
        id: order.id,
        status: order.status,
        amounts: {
            subtotal: Price.toOutput(order.subtotalAmount),
            shipping: Price.toOutput(order.shippingAmount),
            tax: Price.toOutput(order.taxAmount),
            discount: Price.toOutput(order.discountAmount),
            total: Price.toOutput(order.totalAmount),
        },
        coupon: order.coupon
            ? { code: order.coupon.code, type: order.coupon.type }
            : null,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod
            ? {
                  type: order.paymentMethod.type,
                  brand: order.paymentMethod.brand,
                  last4: order.paymentMethod.last4,
              }
            : null,
        items: order.items.map((item) => {
            const review = item.productId ? reviewMap.get(item.productId) : null;
            return {
                id: item.id,
                productId: item.productId,
                quantity: item.quantity,
                price: Price.toOutput(item.unitPrice),
                subtotal: Price.toOutput(
                    String(Number(item.unitPrice) * item.quantity),
                ),
                product: item.productSnapshot,
                isReviewed: !!review,
                review: review ? {
                    id: review.id,
                    rating: review.rating,
                    title: review.title,
                    comment: review.comment,
                    createdAt: review.createdAt,
                    media: review.media?.map((m) => ({
                        id: m.id,
                        type: m.type,
                        url: m.imageUrl
                    })) || []
                } : null,
            };
        }),
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
    };
}

function serializeOrderSummary(order: OrderSummary) {
    return {
        id: order.id,
        status: order.status,
        total: Price.toOutput(order.totalAmount),
        itemCount: order.items.length,
        items: order.items.map((item) => ({
            quantity: item.quantity,
            product: item.productSnapshot,
        })),
        createdAt: order.createdAt,
    };
}
