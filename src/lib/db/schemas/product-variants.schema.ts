import {
    boolean,
    integer,
    jsonb,
    numeric,
    pgTable,
    text,
    uniqueIndex,
    varchar,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';
import { products } from './products.schema';

export type VariantAttributes = Record<string, string>;

export const productVariants = pgTable(
    'product_variants',
    {
        id:        text('id').primaryKey().$defaultFn(() => uuidv7()),
        productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
        sku:       varchar('sku', { length: 100 }).notNull().unique(),
        gtin:      varchar('gtin', { length: 14 }),
        price: integer('price'),
        stock:      integer('stock').notNull().default(0),
        attributes: jsonb('attributes').$type<VariantAttributes>().notNull(),
        isActive:   boolean('is_active').notNull().default(true),
        weightInGrams: integer('weight_in_grams'),
        lengthCm:      numeric('length_cm', { precision: 6, scale: 1 }),
        widthCm:       numeric('width_cm',  { precision: 6, scale: 1 }),
        heightCm:      numeric('height_cm', { precision: 6, scale: 1 }),
    },
    (t) => [
        uniqueIndex('idx_product_variants_sku').on(t.sku),
    ],
);

export type ProductVariant    = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;