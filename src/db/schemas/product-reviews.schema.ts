/**
 * product-reviews.schema.ts
 * ─────────────────────────────────────────────────────────────
 * Avaliações de produtos por usuários.
 *
 * isVerifiedPurchase: true quando orderId está preenchido
 *   e o pedido tem status = 'delivered'. Calculado no Service
 *   ao criar o review.
 *
 * status: moderação — apenas reviews 'approved' são exibidos
 *   publicamente. Admin pode aprovar ou rejeitar.
 *
 * Após aprovação/rejeição, um job atualiza
 *   products.ratingAvg e products.ratingCount.
 * ─────────────────────────────────────────────────────────────
 */

import { sql } from 'drizzle-orm';
import {
    boolean,
    check,
    index,
    pgEnum,
    pgTable,
    smallint,
    text,
    timestamp,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core';
import { user } from './auth.schema';
import { products } from './products.schema';

// ── Enums ─────────────────────────────────────────────────────
export const reviewStatusEnum = pgEnum('review_status_enum', [
    'pending',
    'approved',
    'rejected',
]);

// ── Table ─────────────────────────────────────────────────────
export const productReviews = pgTable(
    'product_reviews',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        productId: uuid('product_id')
            .notNull()
            .references(() => products.id, { onDelete: 'cascade' }),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        /** FK para vincular o review a uma compra verificada */
        orderId: uuid('order_id'),
        /** 1 a 5 estrelas — CHECK constraint adicionado abaixo */
        rating: smallint('rating').notNull(),
        title: varchar('title', { length: 120 }),
        body: text('body'),
        isVerifiedPurchase: boolean('is_verified_purchase')
            .notNull()
            .default(false),
        status: reviewStatusEnum('status').notNull().default('pending'),
        createdAt: timestamp('created_at').notNull().defaultNow(),
    },
    (t) => [
        index('idx_product_reviews_product_id').on(t.productId),
        index('idx_product_reviews_user_id').on(t.userId),
        index('idx_product_reviews_status').on(t.status),
        check('chk_rating_range', sql`${t.rating} >= 1 AND ${t.rating} <= 5`),
    ],
);

// ── Types ─────────────────────────────────────────────────────
export type ProductReview = typeof productReviews.$inferSelect;
export type NewProductReview = typeof productReviews.$inferInsert;
