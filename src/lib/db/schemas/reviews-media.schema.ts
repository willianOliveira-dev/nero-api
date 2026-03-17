import {
    integer,
    pgEnum,
    pgTable,
    text,
    timestamp,
    varchar,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';
import { productReviews } from './product-reviews.schema';
 
export const reviewMediaTypeEnum = pgEnum('review_media_type_enum', [
    'image',
    'video',
]);
 
export const reviewMedia = pgTable('review_media', {
    id:           text('id').primaryKey().$defaultFn(() => uuidv7()),
    reviewId:     text('review_id').notNull().references(() => productReviews.id, { onDelete: 'cascade' }),
    type:         reviewMediaTypeEnum('type').notNull(),
    imageUrl:          text('url').notNull(),
    thumbnailUrl: text('thumbnail_url'),
    duration:     varchar('duration', { length: 20 }),
    sortOrder:    integer('sort_order').notNull().default(0),
    createdAt:    timestamp('created_at').notNull().defaultNow(),
});
 
export type ReviewMedia    = typeof reviewMedia.$inferSelect;
export type NewReviewMedia = typeof reviewMedia.$inferInsert;
 