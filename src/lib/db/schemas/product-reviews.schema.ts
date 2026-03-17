import {
    boolean,
    integer,
    pgEnum,
    pgTable,
    smallint,
    text,
    timestamp,
    varchar,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';
import { user } from './auth.schema';
import { orders } from './orders.schema';
import { products } from './products.schema';

export const reviewStatusEnum = pgEnum('review_status_enum', [
    'pending',
    'approved',
    'rejected',
]);

export const productReviews = pgTable('product_reviews', {
    id: text('id')
        .primaryKey()
        .$defaultFn(() => uuidv7()),
    productId: text('product_id')
        .notNull()
        .references(() => products.id, { onDelete: 'cascade' }),
    userId: text('user_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    orderId: text('order_id').references(() => orders.id, {
        onDelete: 'set null',
    }),
    rating: smallint('rating').notNull(),
    title: varchar('title', { length: 120 }),
    comment: text('comment'),
    variantPurchased: varchar('variant_purchased', { length: 255 }),
    isVerifiedPurchase: boolean('is_verified_purchase')
        .notNull()
        .default(false),
    status: reviewStatusEnum('status').notNull().default('pending'),
    likesCount: integer('likes_count').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type ProductReview = typeof productReviews.$inferSelect;
export type NewProductReview = typeof productReviews.$inferInsert;
