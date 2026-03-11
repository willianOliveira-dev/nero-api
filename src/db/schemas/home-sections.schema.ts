/**
 * home-sections.schema.ts
 * ─────────────────────────────────────────────────────────────
 * Seções configuráveis da home pelo painel admin.
 * Elimina a necessidade de deploy para criar/reordenar seções.
 *
 * Slugs padrão:
 *   top-selling  → filterJson: { sort: "recommended", limit: 10 }
 *   new-in       → filterJson: { sort: "newest", limit: 10, daysAgo: 30 }
 *   flash-sale   → filterJson: { deals: "on_sale", limit: 10 }
 *
 * O endpoint GET /v1/home executa as queries de cada seção
 * usando o filterJson como parâmetros.
 * ─────────────────────────────────────────────────────────────
 */

import {
    boolean,
    jsonb,
    pgEnum,
    pgTable,
    smallint,
    text,
    timestamp,
    uniqueIndex,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core';
import { uuidv7 } from 'uuidv7';

// ── Enum ──────────────────────────────────────────────────────
export const homeSectionTypeEnum = pgEnum('home_section_type_enum', [
    'product_list',
    'category_list',
    'banner',
]);

// ── Type para o JSONB de filtros ──────────────────────────────
export type SectionFilterJson = {
    sort?: 'recommended' | 'newest' | 'price_asc' | 'price_desc';
    gender?: 'men' | 'women' | 'kids' | 'unisex';
    deals?: 'on_sale' | 'free_shipping';
    limit?: number;
    daysAgo?: number; // para "New In": produtos dos últimos N dias
};

// ── Table ─────────────────────────────────────────────────────
export const homeSections = pgTable(
    'home_sections',
    {
        id: text('id')
            .primaryKey()
            .$defaultFn(() => uuidv7()),
        slug: varchar('slug', { length: 80 }).notNull().unique(),
        title: varchar('title', { length: 120 }).notNull(),
        type: homeSectionTypeEnum('type').notNull(),
        sortOrder: smallint('sort_order').notNull().default(0),
        isActive: boolean('is_active').notNull().default(true),
        filterJson: jsonb('filter_json').$type<SectionFilterJson>(),
        updatedAt: timestamp('updated_at').notNull().defaultNow(),
    },
    (t) => [uniqueIndex('idx_home_sections_slug').on(t.slug)],
);

// ── Types ─────────────────────────────────────────────────────
export type HomeSection = typeof homeSections.$inferSelect;
export type NewHomeSection = typeof homeSections.$inferInsert;
