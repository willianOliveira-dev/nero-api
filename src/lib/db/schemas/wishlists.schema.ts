
import {
    boolean,
    index,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    varchar,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';
import { user } from './auth.schema';
import { products } from './products.schema';


export const wishlists = pgTable(
    'wishlists',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => uuidv7()),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        name: varchar('name', { length: 100 }).notNull(),
        isDefault: boolean('is_default').notNull().default(false),
        createdAt: timestamp('created_at').notNull().defaultNow(),
    },
    (t) => [index('idx_wishlists_user_id').on(t.userId)],
);


export const wishlistItems = pgTable(
    'wishlist_items',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => uuidv7()),
        wishlistId: text('wishlist_id')
            .notNull()
            .references(() => wishlists.id, { onDelete: 'cascade' }),
        productId: text('product_id')
            .notNull()
            .references(() => products.id, { onDelete: 'cascade' }),
        addedAt: timestamp('added_at').notNull().defaultNow(),
    },
    (t) => [
        index('idx_wishlist_items_wishlist_id').on(t.wishlistId),
        uniqueIndex('idx_wishlist_items_unique').on(t.wishlistId, t.productId),
    ],
);


export type Wishlist = typeof wishlists.$inferSelect;
export type NewWishlist = typeof wishlists.$inferInsert;
export type WishlistItem = typeof wishlistItems.$inferSelect;
export type NewWishlistItem = typeof wishlistItems.$inferInsert;
