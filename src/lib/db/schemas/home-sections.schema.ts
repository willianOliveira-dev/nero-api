import {
    boolean,
    jsonb,
    pgEnum,
    pgTable,
    smallint,
    text,
    timestamp,
    uniqueIndex,
    varchar,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';


export const homeSectionTypeEnum = pgEnum('home_section_type_enum', [
    'top_selling',
    'new_in',
    'on_sale',
    'free_shipping',
    'by_gender',
    'category_list',
    'banner',
]);


export type SectionFilterJson = {
    gender?:  'men' | 'women' | 'kids' | 'unisex';
    limit?:   number;
    daysAgo?: number;
};

export const homeSections = pgTable(
    'home_sections',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => uuidv7()),
        slug:      varchar('slug',  { length: 80  }).notNull().unique(),
        title:     varchar('title', { length: 120 }).notNull(),
        type:      homeSectionTypeEnum('type').notNull(),
        sortOrder: smallint('sort_order').notNull().default(0),
        isActive:  boolean('is_active').notNull().default(true),
        filterJson: jsonb('filter_json').$type<SectionFilterJson>(),
        updatedAt: timestamp('updated_at').notNull().defaultNow(),
    },
    (t) => [uniqueIndex('idx_home_sections_slug').on(t.slug)],
);


export type HomeSection    = typeof homeSections.$inferSelect;
export type NewHomeSection = typeof homeSections.$inferInsert;