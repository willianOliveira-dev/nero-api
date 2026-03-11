/**
 * wishlists.schema.ts
 * ─────────────────────────────────────────────────────────────
 * Múltiplas listas de favoritos por usuário.
 * Exemplos: "My Favorite (12)", "T-Shirts (4)".
 *
 * isDefault: lista que recebe o produto ao clicar no coração
 *   sem o usuário escolher uma lista específica.
 *
 * wishlist_items: UNIQUE em (wishlistId, productId) para
 *   garantir que o mesmo produto não entre duplicado.
 *   Adicionar produto já existente é idempotente (200 OK).
 * ─────────────────────────────────────────────────────────────
 */

import {
    boolean,
    index,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core';
import { user } from './auth.schema';
import { products } from './products.schema';

// ── wishlists ─────────────────────────────────────────────────
export const wishlists = pgTable(
    'wishlists',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        userId: text('user_id')
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
        name: varchar('name', { length: 100 }).notNull(),
        isDefault: boolean('is_default').notNull().default(false),
        createdAt: timestamp('created_at').notNull().defaultNow(),
    },
    (t) => [index('idx_wishlists_user_id').on(t.userId)],
);

// ── wishlist_items ────────────────────────────────────────────
export const wishlistItems = pgTable(
    'wishlist_items',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        wishlistId: uuid('wishlist_id')
            .notNull()
            .references(() => wishlists.id, { onDelete: 'cascade' }),
        productId: uuid('product_id')
            .notNull()
            .references(() => products.id, { onDelete: 'cascade' }),
        addedAt: timestamp('added_at').notNull().defaultNow(),
    },
    (t) => [
        index('idx_wishlist_items_wishlist_id').on(t.wishlistId),
        uniqueIndex('idx_wishlist_items_unique').on(t.wishlistId, t.productId),
    ],
);

// ── Types ─────────────────────────────────────────────────────
export type Wishlist = typeof wishlists.$inferSelect;
export type NewWishlist = typeof wishlists.$inferInsert;
export type WishlistItem = typeof wishlistItems.$inferSelect;
export type NewWishlistItem = typeof wishlistItems.$inferInsert;
