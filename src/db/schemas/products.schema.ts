/**
 * products.schema.ts
 * ─────────────────────────────────────────────────────────────
 * Tabela central do catálogo de moda.
 *
 * Campos de performance/busca:
 *   - searchVector: tsvector gerado automaticamente pelo PG
 *     (full-text search em nome + descrição, índice GIN)
 *   - ratingAvg / ratingCount: cacheados, atualizados via
 *     job assíncrono após aprovação de review
 *   - soldCount: incrementado via job após pagamento confirmado
 *     (NUNCA no fluxo crítico do checkout)
 *
 * Campos de promoção:
 *   - originalPrice: preço antes da promoção (exibido riscado)
 *   - freeShipping: elegível para frete grátis (filtro Deals)
 * ─────────────────────────────────────────────────────────────
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  integer,
  boolean,
  timestamp,
  index,
  uniqueIndex,
  pgEnum,
  customType,
} from "drizzle-orm/pg-core";
import { categories } from "./categories.schema";

// ── Enums ─────────────────────────────────────────────────────
export const productStatusEnum = pgEnum("product_status_enum", [
  "draft",
  "active",
  "archived",
]);

export const productGenderEnum = pgEnum("product_gender_enum", [
  "men",
  "women",
  "kids",
  "unisex",
]);

// ── tsvector custom type (gerado pelo PG, não inserido pela app)
const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

// ── Table ─────────────────────────────────────────────────────
export const products = pgTable(
  "products",
  {
    id:            uuid("id").primaryKey().defaultRandom(),
    name:          varchar("name", { length: 255 }).notNull(),
    slug:          varchar("slug", { length: 280 }).notNull().unique(),
    description:   text("description"),
    basePrice:     numeric("base_price", { precision: 10, scale: 2 }).notNull(),
    /** Preço antes da promoção — exibido riscado quando preenchido */
    originalPrice: numeric("original_price", { precision: 10, scale: 2 }),
    categoryId:    uuid("category_id")
                     .references(() => categories.id, { onDelete: "set null" }),
    gender:        productGenderEnum("gender").notNull(),
    status:        productStatusEnum("status").notNull().default("draft"),
    freeShipping:  boolean("free_shipping").notNull().default(false),
    isFeatured:    boolean("is_featured").notNull().default(false),
    /** Incrementado via job após pagamento — nunca no checkout */
    soldCount:     integer("sold_count").notNull().default(0),
    /** Cacheado — atualizado após aprovação de review */
    ratingAvg:     numeric("rating_avg", { precision: 3, scale: 2 }).default("0"),
    ratingCount:   integer("rating_count").notNull().default(0),
    /**
     * Gerado pelo PostgreSQL via trigger ou GENERATED ALWAYS AS.
     * Criado na migration com:
     *   ALTER TABLE products ADD COLUMN search_vector tsvector
     *   GENERATED ALWAYS AS (
     *     to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,''))
     *   ) STORED;
     *   CREATE INDEX idx_products_search ON products USING GIN(search_vector);
     */
    searchVector:  tsvector("search_vector"),
    createdAt:     timestamp("created_at").notNull().defaultNow(),
    updatedAt:     timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("idx_products_slug").on(t.slug),
    index("idx_products_category_id").on(t.categoryId),
    index("idx_products_gender").on(t.gender),
    index("idx_products_status").on(t.status),
    index("idx_products_base_price").on(t.basePrice),
    index("idx_products_rating_sold").on(t.ratingAvg, t.soldCount),
    // Partial index para On Sale (menor e mais rápido):
    // CREATE INDEX idx_products_on_sale ON products(id)
    //   WHERE original_price IS NOT NULL;
    // → adicionar na migration manual
  ]
);

// ── Types ─────────────────────────────────────────────────────
export type Product    = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
