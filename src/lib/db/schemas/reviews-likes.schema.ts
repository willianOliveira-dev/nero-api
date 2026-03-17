import { pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { user } from './auth.schema';
import { productReviews } from './product-reviews.schema';

export const reviewLikes = pgTable(
    'review_likes',
    {
        reviewId: text('review_id')
            .notNull()
            .references(() => productReviews.id, { onDelete: 'cascade' }),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        createdAt: timestamp('created_at').notNull().defaultNow(),
    },
    (t) => [uniqueIndex('idx_review_likes_unique').on(t.reviewId, t.userId)],
);

export type ReviewLike = typeof reviewLikes.$inferSelect;
export type NewReviewLike = typeof reviewLikes.$inferInsert;
