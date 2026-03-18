import {
	index,
	pgTable,
	smallint,
	text,
	varchar,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';
import { variationTypes } from './variation-types.schema';

export const variationOptions = pgTable(
	'variation_options',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => uuidv7()),
		variationTypeId: text('variation_type_id')
			.notNull()
			.references(() => variationTypes.id, { onDelete: 'cascade' }),
		value: varchar('value', { length: 100 }).notNull(),
		/** Imagem da opção — obrigatório se variationType.hasImage = true */
		imageUrl: text('image_url'),
		position: smallint('position').notNull().default(1),
	},
	(t) => [
		index('idx_variation_options_type_id').on(t.variationTypeId),
		index('idx_variation_options_position').on(
			t.variationTypeId,
			t.position,
		),
	],
);

export type VariationOption = typeof variationOptions.$inferSelect;
export type NewVariationOption = typeof variationOptions.$inferInsert;
