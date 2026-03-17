import {
    boolean,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    varchar,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';

export const brands = pgTable(
    'brands',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => uuidv7()),
        name: varchar('name', { length: 120 }).notNull(),
        slug: varchar('slug', { length: 120 }).notNull().unique(),
        logoUrl: text('logo_url'),
        isActive: boolean('is_active').notNull().default(true),
        createdAt: timestamp('created_at').notNull().defaultNow(),
    },
    (t) => [uniqueIndex('idx_brands_slug').on(t.slug)],
);

export type Brand = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;
