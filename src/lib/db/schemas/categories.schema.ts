import {
    boolean,
    index,
    pgTable,
    smallint,
    text,
    timestamp,
    uniqueIndex,
    varchar,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';


export const categories = pgTable(
    'categories',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => uuidv7()),
        name: varchar('name', { length: 100 }).notNull(),
        slug: varchar('slug', { length: 120 }).notNull().unique(),
        parentId: text('parent_id'),
        iconUrl: text('icon_url'),
        imageUrl: text('image_url'),
        sortOrder: smallint('sort_order').notNull().default(0),
        isActive: boolean('is_active').notNull().default(true),
        createdAt: timestamp('created_at').notNull().defaultNow(),
    },
    (t) => [
        uniqueIndex('idx_categories_slug').on(t.slug),
        index('idx_categories_parent_id').on(t.parentId),
    ],
);


export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
