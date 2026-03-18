import {
	boolean,
	index,
	integer,
	pgTable,
	text,
	uniqueIndex,
	varchar,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';
import { products } from './products.schema';

export const productSkus = pgTable(
	'product_skus',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => uuidv7()),
		productId: text('product_id')
			.notNull()
			.references(() => products.id, { onDelete: 'cascade' }),
		price: integer('price').notNull(),
		/** Preço "de" em centavos — null se não houver desconto */
		compareAtPrice: integer('compare_at_price'),
		stock: integer('stock').notNull().default(0),
		skuCode: varchar('sku_code', { length: 100 }).notNull().unique(),
		ean: varchar('ean', { length: 14 }),
		isActive: boolean('is_active').notNull().default(true),
	},
	(t) => [
		index('idx_product_skus_product_id').on(t.productId),
		uniqueIndex('idx_product_skus_sku_code').on(t.skuCode),
	],
);

// ── Types ─────────────────────────────────────────────────────
export type ProductSku = typeof productSkus.$inferSelect;
export type NewProductSku = typeof productSkus.$inferInsert;
