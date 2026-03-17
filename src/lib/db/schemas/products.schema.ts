import {
    boolean,
    customType,
    index,
    integer,
    numeric,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    varchar,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';
import { brands } from './brands.schema';
import { categories } from './categories.schema';

export const productStatusEnum = pgEnum('product_status_enum', [
    'draft',
    'active',
    'archived',
]);

export const productGenderEnum = pgEnum('product_gender_enum', [
    'men',
    'women',
    'kids',
    'unisex',
]);

const tsvector = customType<{ data: string }>({
    dataType() {
        return 'tsvector';
    },
});

export const products = pgTable(
    'products',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => uuidv7()),
        name: varchar('name', { length: 255 }).notNull(),
        slug: varchar('slug', { length: 280 }).notNull().unique(),
        description: text('description'),

        basePrice: integer('base_price').notNull(),

        originalPrice: integer('original_price'),

        categoryId: text('category_id').references(() => categories.id, {
            onDelete: 'set null',
        }),
        brandId: text('brand_id').references(() => brands.id, {
            onDelete: 'set null',
        }),

        sizeChartUrl: text('size_chart_url'),

        gender: productGenderEnum('gender').notNull(),

        status: productStatusEnum('status').notNull().default('draft'),

        freeShipping: boolean('free_shipping').notNull().default(false),

        soldCount: integer('sold_count').notNull().default(0),

        ratingAvg: numeric('rating_avg', { precision: 3, scale: 2 }).default(
            '0',
        ),
        ratingCount: integer('rating_count').notNull().default(0),

        searchVector: tsvector('search_vector'),

        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow(),
    },
    (t) => [
        uniqueIndex('idx_products_slug').on(t.slug),
        index('idx_products_category_id').on(t.categoryId),
        index('idx_products_brand_id').on(t.brandId),
        index('idx_products_gender').on(t.gender),
        index('idx_products_status').on(t.status),
        index('idx_products_base_price').on(t.basePrice),
        index('idx_products_rating_sold').on(t.ratingAvg, t.soldCount),
    ],
);

// ── Types ─────────────────────────────────────────────────────
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
