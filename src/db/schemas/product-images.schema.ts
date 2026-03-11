/**
 * product-images.schema.ts
 * ─────────────────────────────────────────────────────────────
 * Galeria de imagens de produto.
 * Máximo de 5 imagens por produto (regra aplicada no Service).
 *
 * variantId: quando preenchido, a imagem é exibida
 *   automaticamente ao usuário selecionar aquela variante
 *   (ex: trocar para a foto do casaco preto ao selecionar "Black").
 *
 * isPrimary: thumbnail exibido nos cards de produto,
 *   wishlist e carrinho.
 *
 * position: ordem de exibição na galeria (1 a 5).
 * ─────────────────────────────────────────────────────────────
 */

import {
    boolean,
    index,
    pgTable,
    smallint,
    text,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';
import { productVariants } from './product-variants.schema';
import { products } from './products.schema';

// ── Table ─────────────────────────────────────────────────────
export const productImages = pgTable(
    'product_images',
    {
        id: text('id')
            .primaryKey()
            .$onUpdateFn(() => uuidv7()),
        productId: uuid('product_id')
            .notNull()
            .references(() => products.id, { onDelete: 'cascade' }),
        /** null = imagem geral do produto (não específica de variante) */
        variantId: uuid('variant_id').references(() => productVariants.id, {
            onDelete: 'set null',
        }),
        /** URL pública no S3 / Cloudflare R2 */
        url: text('url').notNull(),
        altText: varchar('alt_text', { length: 255 }),
        /** 1 = principal, máx 5 por produto */
        position: smallint('position').notNull().default(1),
        isPrimary: boolean('is_primary').notNull().default(false),
    },
    (t) => [
        index('idx_product_images_product_id').on(t.productId),
        index('idx_product_images_position').on(t.productId, t.position),
    ],
);

// ── Types ─────────────────────────────────────────────────────
export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;
