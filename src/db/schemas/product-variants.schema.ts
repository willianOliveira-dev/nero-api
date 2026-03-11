/**
 * product-variants.schema.ts
 * ─────────────────────────────────────────────────────────────
 * SKUs individuais de cada produto.
 * Cada variante combina atributos (cor, tamanho, etc.)
 * armazenados em JSONB flexível.
 *
 * Exemplo de attributes:
 *   { "color": "Lemon", "hexColor": "#F5C518", "size": "M" }
 *   { "color": "Black", "hexColor": "#000000", "size": "L" }
 *   { "size": "XL" }
 *
 * price: quando null, o produto usa products.basePrice.
 * ─────────────────────────────────────────────────────────────
 */

import {
    boolean,
    index,
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

// ── Types para o JSONB de atributos ──────────────────────────
export type VariantAttributes = {
    size?: string; // "S" | "M" | "L" | "XL" | "2XL"
    color?: string; // "Lemon" | "Black" | "Sage Green"
    hexColor?: string; // "#F5C518" — para renderizar o swatch
    [key: string]: string | undefined; // extensível para futuros atributos
};

// ── Table ─────────────────────────────────────────────────────
export const productVariants = pgTable(
    'product_variants',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => uuidv7()),
        productId: text('product_id')
            .notNull()
            .references(() => products.id, { onDelete: 'cascade' }),
        /** Ex: JACKET-M-LEMON — deve ser único globalmente */
        sku: varchar('sku', { length: 100 }).notNull().unique(),
        /** null = herda products.basePrice */
        price: numeric('price', { precision: 10, scale: 2 }),
        stock: integer('stock').notNull().default(0),
        attributes: jsonb('attributes').$type<VariantAttributes>().notNull(),
        isActive: boolean('is_active').notNull().default(true),
    },
    (t) => [
        uniqueIndex('idx_product_variants_sku').on(t.sku),
        index('idx_product_variants_product_id').on(t.productId),
    ],
);
// ── Types ─────────────────────────────────────────────────────
export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
