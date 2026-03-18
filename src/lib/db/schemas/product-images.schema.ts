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

export const productImages = pgTable(
	'product_images',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => uuidv7()),
		productId: text('product_id')
			.notNull()
			.references(() => products.id, { onDelete: 'cascade' }),
		/** URL pública no Cloudinary */
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


export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;
