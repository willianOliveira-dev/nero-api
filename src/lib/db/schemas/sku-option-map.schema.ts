import { pgTable, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';
import { productSkus } from './product-skus.schema';
import { variationOptions } from './variation-options.schema';

export const skuOptionMap = pgTable(
	'sku_option_map',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => uuidv7()),
		skuId: text('sku_id')
			.notNull()
			.references(() => productSkus.id, { onDelete: 'cascade' }),
		variationOptionId: text('variation_option_id')
			.notNull()
			.references(() => variationOptions.id, { onDelete: 'cascade' }),
	},
	(t) => [
		uniqueIndex('idx_sku_option_map_unique').on(
			t.skuId,
			t.variationOptionId,
		),
	],
);


export type SkuOptionMap = typeof skuOptionMap.$inferSelect;
export type NewSkuOptionMap = typeof skuOptionMap.$inferInsert;
