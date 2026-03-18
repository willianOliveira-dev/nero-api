import {
	boolean,
	index,
	pgTable,
	smallint,
	text,
	varchar,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';
import { products } from './products.schema';

export const variationTypes = pgTable(
	'variation_types',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => uuidv7()),
		productId: text('product_id')
			.notNull()
			.references(() => products.id, { onDelete: 'cascade' }),
		name: varchar('name', { length: 100 }).notNull(),
		position: smallint('position').notNull().default(1),
		/** Somente position = 1 pode ter hasImage = true */
		hasImage: boolean('has_image').notNull().default(false),
	},
	(t) => [
		index('idx_variation_types_product_id').on(t.productId),
		index('idx_variation_types_position').on(t.productId, t.position),
	],
);

export type VariationType = typeof variationTypes.$inferSelect;
export type NewVariationType = typeof variationTypes.$inferInsert;
